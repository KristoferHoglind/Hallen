using System.Security.Claims;
using Hallen.Database.Entities;
using Hallen.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Hallen.Api.Security;

// Only identifiers and field names are recorded. Never passwords, tokens, keys or request bodies.
public class AuditInterceptor(IHttpContextAccessor accessor) : SaveChangesInterceptor
{
    private void Record(DbContext? db)
    {
        if (db is null || accessor.HttpContext is null) return;
        var actor = Guid.TryParse(accessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : (Guid?)null;
        var events = new List<AuditEvent>();
        foreach (var entry in db.ChangeTracker.Entries().ToList())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted)) continue;
            var allowedFields = entry.Entity switch {
                AppUser => new[] {"IsSysAdmin","CanCreateGroups","Status","TwoFactorEnabled","PasswordHash"},
                SportsGroupMember => new[] {"Role","Status"},
                GroupInvitation => new[] {"RevokedAt","UsedAt"},
                SportsGroup => new[] {"Name","Description"},
                GameSession => new[] {"IsClosed"},
                _ => null
            };
            if (allowedFields is null) continue;
            var fields = entry.Properties.Where(p => p.IsModified && !Equals(p.OriginalValue,p.CurrentValue) && allowedFields.Contains(p.Metadata.Name)).Select(p => p.Metadata.Name).ToArray();
            // A password rehash on login is not a password change. Identity may mark
            // all columns modified; compare actual old/new values to avoid false events.
            if (entry.Entity is AppUser && Equals(entry.Property("SecurityStamp").OriginalValue,entry.Property("SecurityStamp").CurrentValue))
                fields = fields.Where(field => field != "PasswordHash").ToArray();
            if (entry.State == EntityState.Modified && fields.Length == 0) continue;
            if (entry.Entity is GameSession && entry.State != EntityState.Modified) continue;
            events.Add(new() {Id=Guid.NewGuid(),CreatedAt=DateTimeOffset.UtcNow,ActorUserId=actor,
                EntityType=entry.Metadata.ClrType.Name,EntityId=entry.Property("Id").CurrentValue?.ToString() ?? "",
                Action=entry.State.ToString(),ChangedFields=fields});
        }
        db.Set<AuditEvent>().AddRange(events);
    }
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result) { Record(eventData.Context); return result; }
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default) { Record(eventData.Context); return ValueTask.FromResult(result); }
}
