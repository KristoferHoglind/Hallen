using System.Security.Cryptography;
using System.Text;
using Hallen.Application.SportsGroups;
using Hallen.Common.DTOs.Invitations;
using Hallen.Database.Data;
using Hallen.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.Invitations;

public class InvitationService(HallenDbContext db, ISportsGroupAuthorizationService authorization)
{
    public async Task<CreatedInvitationDto?> CreateAsync(Guid groupId, string role, Guid userId)
    {
        if (!Enum.TryParse<SportsGroupRole>(role, out var requested) || !Enum.IsDefined(requested)
            || !MayInvite(await authorization.GetRoleAsync(groupId, userId), requested)) return null;

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var now = DateTimeOffset.UtcNow;
        var invitation = new GroupInvitation
        {
            Id = Guid.NewGuid(), SportsGroupId = groupId, CreatedByUserId = userId,
            TokenHash = Hash(token), Role = requested, CreatedAt = now, ExpiresAt = now.AddHours(72),
        };
        db.GroupInvitations.Add(invitation);
        await db.SaveChangesAsync();
        await db.Entry(invitation).Reference(item => item.SportsGroup).LoadAsync();
        return new CreatedInvitationDto(ToDto(invitation), token);
    }

    private Task<bool> IsSystemAdminAsync(Guid userId) => db.Users.AsNoTracking().AnyAsync(user =>
        user.Id == userId && user.IsSysAdmin && user.Status == UserAccountStatus.Active);

    public async Task<CreatedInvitationDto?> CreateHallenAsync(Guid userId)
    {
        if (!await IsSystemAdminAsync(userId)) return null;
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var now = DateTimeOffset.UtcNow;
        var invitation = new GroupInvitation
        {
            Id = Guid.NewGuid(), CreatedByUserId = userId, SportsGroupId = null,
            TokenHash = Hash(token), CreatedAt = now, ExpiresAt = now.AddHours(72),
        };
        db.GroupInvitations.Add(invitation);
        await db.SaveChangesAsync();
        return new CreatedInvitationDto(ToDto(invitation), token);
    }

    public async Task<List<InvitationDto>?> ListHallenAsync(Guid userId)
    {
        if (!await IsSystemAdminAsync(userId)) return null;
        return await db.GroupInvitations.AsNoTracking().Where(item => item.SportsGroupId == null)
            .OrderByDescending(item => item.CreatedAt).Take(25)
            .Select(item => new InvitationDto(item.Id, null, null, item.Role.ToString(),
                item.CreatedAt, item.ExpiresAt, item.UsedAt != null, item.RevokedAt != null)).ToListAsync();
    }

    public async Task<List<InvitationDto>?> ListAsync(Guid groupId, Guid userId)
    {
        if (!await authorization.CanManageSportsGroupAsync(groupId, userId)) return null;
        return await db.GroupInvitations.AsNoTracking().Where(item => item.SportsGroupId == groupId)
            .OrderByDescending(item => item.CreatedAt).Take(25)
            .Select(item => new InvitationDto(item.Id, item.SportsGroupId, item.SportsGroup!.Name,
                item.Role.ToString(), item.CreatedAt, item.ExpiresAt, item.UsedAt != null, item.RevokedAt != null))
            .ToListAsync();
    }

    public async Task<bool> RevokeAsync(Guid? groupId, Guid id, Guid userId)
    {
        var invitation = await db.GroupInvitations.FirstOrDefaultAsync(item => item.Id == id && item.SportsGroupId == groupId);
        if (invitation is null) return false;
        if (groupId is Guid group)
        {
            if (!MayInvite(await authorization.GetRoleAsync(group, userId), invitation.Role)) return false;
        }
        else if (!await IsSystemAdminAsync(userId)) return false;
        // Serialize revocation with redemption, including requests on other instances.
        await using var transaction = await db.Database.BeginTransactionAsync();
        invitation = await db.GroupInvitations.FromSqlInterpolated($"SELECT * FROM \"GroupInvitations\" WHERE \"Id\" = {id} FOR UPDATE")
            .AsNoTracking().SingleOrDefaultAsync();
        if (invitation is null || invitation.UsedAt is not null) return false;
        await db.GroupInvitations.Where(item => item.Id == id).ExecuteUpdateAsync(setters => setters.SetProperty(item => item.RevokedAt, DateTimeOffset.UtcNow));
        await transaction.CommitAsync();
        return true;
    }

    public async Task<GroupInvitation?> FindValidAsync(string? token, bool lockRow = false)
    {
        if (token is null || token.Length != 64 || !token.All(Uri.IsHexDigit)) return null;
        var hash = Hash(token);
        GroupInvitation? invitation;
        if (lockRow)
        {
            if (db.Database.CurrentTransaction is null) throw new InvalidOperationException("An invitation must be consumed inside a transaction.");
            invitation = await db.GroupInvitations.FromSqlInterpolated($"SELECT * FROM \"GroupInvitations\" WHERE \"TokenHash\" = {hash} FOR UPDATE")
                .SingleOrDefaultAsync();
        }
        else
            invitation = await db.GroupInvitations.AsNoTracking().SingleOrDefaultAsync(item => item.TokenHash == hash);
        if (invitation is null || invitation.UsedAt is not null || invitation.RevokedAt is not null || invitation.ExpiresAt <= DateTimeOffset.UtcNow)
            return null;
        if (invitation.SportsGroupId is Guid groupId)
        {
            if (!MayInvite(await authorization.GetRoleAsync(groupId, invitation.CreatedByUserId), invitation.Role)) return null;
            await db.Entry(invitation).Reference(item => item.SportsGroup).LoadAsync();
        }
        else if (!await IsSystemAdminAsync(invitation.CreatedByUserId)) return null;
        return invitation;
    }

    public async Task<bool> AddMembershipAsync(GroupInvitation invitation, Guid userId)
    {
        if (invitation.SportsGroupId is null)
        {
            invitation.UsedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return true;
        }
        // Don't let an invitation silently reinstate a blocked/revoked membership
        // or change an existing member's role.
        if (await db.SportsGroupMembers.AnyAsync(member => member.SportsGroupId == invitation.SportsGroupId && member.AppUserId == userId)) return false;
        var now = DateTimeOffset.UtcNow;
        db.SportsGroupMembers.Add(new SportsGroupMember
        {
            Id = Guid.NewGuid(), SportsGroupId = invitation.SportsGroupId.Value, AppUserId = userId,
            Role = invitation.Role, Status = SportsGroupMemberStatus.Approved, CreatedAt = now,
            ApprovedAt = now, ApprovedByUserId = invitation.CreatedByUserId,
        });
        invitation.UsedAt = now;
        await db.SaveChangesAsync();
        return true;
    }

    public static InvitationDto ToDto(GroupInvitation item) => new(item.Id, item.SportsGroupId,
        item.SportsGroup?.Name, item.Role.ToString(), item.CreatedAt, item.ExpiresAt, item.UsedAt != null, item.RevokedAt != null);
    private static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    private static bool MayInvite(SportsGroupRole? issuer, SportsGroupRole requested) =>
        (issuer == SportsGroupRole.Owner && requested is SportsGroupRole.Member or SportsGroupRole.Admin) || (issuer == SportsGroupRole.Admin && requested == SportsGroupRole.Member);
}
