using System.ComponentModel.DataAnnotations;
using Hallen.Api.Extensions;
using Hallen.Application.SportsGroups;
using Hallen.Common.Privacy;
using Hallen.Database.Data;
using Hallen.Database.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/system/groups")]
public class SystemGroupsController(HallenDbContext db) : ControllerBase
{
    private Task<bool> IsAdmin() => db.Users.AsNoTracking().AnyAsync(user =>
        user.Id == User.GetUserId() && user.IsSysAdmin && user.Status == UserAccountStatus.Active);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        if (!await IsAdmin()) return Forbid();
        var groups = await db.SportsGroups.AsNoTracking().OrderBy(group => group.Name)
            .Select(group => new
            {
                group.Id, group.Name, group.CreatedAt,
                CreatorName = db.Users.Where(user => user.Id == group.CreatedByUserId)
                    .Select(user => user.DisplayName).FirstOrDefault(),
                MemberCount = group.Members.Count(member => member.Status == SportsGroupMemberStatus.Approved),
                PlayerCount = group.Players.Count,
                SessionCount = group.GameSessions.Count,
                MatchCount = group.GameSessions.SelectMany(session => session.GameMatches).Count(),
                Owner = group.Members.Where(member => member.Role == SportsGroupRole.Owner && member.Status == SportsGroupMemberStatus.Approved)
                    .Select(member => new { MemberId = member.Id, member.AppUser.DisplayName,
                        Active = member.AppUser.Status == UserAccountStatus.Active }).FirstOrDefault(),
            }).ToListAsync();
        return Ok(groups);
    }

    [HttpGet("{id:guid}/ownership-candidates")]
    public async Task<IActionResult> Candidates(Guid id)
    {
        if (!await IsAdmin()) return Forbid();
        if (!await db.SportsGroups.AnyAsync(group => group.Id == id)) return NotFound();
        var candidates = await db.SportsGroupMembers.AsNoTracking()
            .Where(member => member.SportsGroupId == id && member.Status == SportsGroupMemberStatus.Approved &&
                member.AppUser.Status == UserAccountStatus.Active &&
                (member.Role == SportsGroupRole.Admin || member.Role == SportsGroupRole.Member))
            .OrderBy(member => member.Role).ThenBy(member => member.AppUser.DisplayName)
            .Select(member => new { MemberId = member.Id, member.AppUser.DisplayName,
                Email = EmailPrivacy.Mask(member.AppUser.Email), Role = member.Role.ToString() }).ToListAsync();
        return Ok(candidates);
    }

    [HttpPut("{id:guid}/owner")]
    public async Task<IActionResult> Transfer(Guid id, SystemGroupTransferRequest request)
    {
        return await Mutate(id, request.ExpectedOwnerMemberId, async () =>
        {
            var successor = await db.SportsGroupMembers.SingleOrDefaultAsync(member => member.Id == request.MemberId &&
                member.SportsGroupId == id && member.Status == SportsGroupMemberStatus.Approved &&
                member.AppUser.Status == UserAccountStatus.Active &&
                (member.Role == SportsGroupRole.Member || member.Role == SportsGroupRole.Admin));
            if (successor is null)
                return BadRequest("Välj en annan aktiv, godkänd medlem i gruppen. Ladda om underlaget om medlemskapet har ändrats.");
            var owner = await db.SportsGroupMembers.SingleOrDefaultAsync(member => member.SportsGroupId == id &&
                member.Role == SportsGroupRole.Owner && member.Status == SportsGroupMemberStatus.Approved);
            if (owner is not null)
            {
                owner.Role = SportsGroupRole.Admin;
                await db.SaveChangesAsync();
            }
            successor.Role = SportsGroupRole.Owner;
            await db.SaveChangesAsync();
            return NoContent();
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, SystemGroupDeleteRequest request)
    {
        return await Mutate(id, request.ExpectedOwnerMemberId, async () =>
        {
            var group = await db.SportsGroups.SingleAsync(group => group.Id == id);
            if (!string.Equals(request.ConfirmationName, group.Name, StringComparison.Ordinal))
                return BadRequest("Gruppnamnet stämmer inte. Ladda om underlaget och skriv gruppens aktuella namn för att bekräfta.");
            await SportsGroupDeletion.DeleteContentsAsync(db, id);
            db.SportsGroups.Remove(group);
            await db.SaveChangesAsync();
            return NoContent();
        });
    }

    private async Task<IActionResult> Mutate(Guid id, Guid? expectedOwnerMemberId, Func<Task<IActionResult>> change)
    {
        try
        {
            await using var transaction = await db.Database.BeginTransactionAsync();
            // Share account-administration locks and ordinary group ownership/deletion locks.
            await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(20661032)");
            db.ChangeTracker.Clear();
            if (!await IsAdmin()) return Forbid();
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM sports_groups WHERE id = {id} FOR UPDATE");
            if (!await db.SportsGroups.AnyAsync(group => group.Id == id)) return NotFound();
            var ownerId = await db.SportsGroupMembers.Where(member => member.SportsGroupId == id &&
                member.Role == SportsGroupRole.Owner && member.Status == SportsGroupMemberStatus.Approved)
                .Select(member => (Guid?)member.Id).SingleOrDefaultAsync();
            if (ownerId != expectedOwnerMemberId)
                return Conflict("Gruppens ägare har ändrats. Ladda om underlaget och bekräfta åtgärden igen.");
            var result = await change();
            if (result is NoContentResult) await transaction.CommitAsync();
            return result;
        }
        catch (Exception exception) when (exception is PostgresException { SqlState: "40P01" or "40001" } ||
            exception.InnerException is PostgresException { SqlState: "40P01" or "40001" })
        {
            return Conflict("Gruppen eller medlemskapet ändrades samtidigt. Ladda om underlaget och försök igen. Ingen ändring genomfördes.");
        }
    }
}

public class SystemGroupTransferRequest
{
    [Required] public Guid? MemberId { get; set; }
    public Guid? ExpectedOwnerMemberId { get; set; }
}

public class SystemGroupDeleteRequest
{
    [Required] public string ConfirmationName { get; set; } = string.Empty;
    public Guid? ExpectedOwnerMemberId { get; set; }
}
