using Hallen.Common.Privacy;
using Hallen.Common.DTOs.Auth;
using Hallen.Database.Data;
using Hallen.Database.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application;

public class AccountAdministrationService(HallenDbContext db, UserManager<AppUser> users)
{
    public async Task<AccountDeletionPlanDto?> GetDeletionPlanAsync(Guid id)
    {
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(user => user.Id == id);
        if (user is null) return null;
        var lastAdmin = user.IsSysAdmin && user.Status == UserAccountStatus.Active &&
            !await db.Users.AnyAsync(other => other.Id != id && other.IsSysAdmin && other.Status == UserAccountStatus.Active);
        var owned = await db.SportsGroupMembers.AsNoTracking()
            .Where(member => member.AppUserId == id && member.Role == SportsGroupRole.Owner && member.Status == SportsGroupMemberStatus.Approved)
            .OrderBy(member => member.SportsGroup.Name)
            .Select(member => new { GroupId = member.SportsGroupId, GroupName = member.SportsGroup.Name }).ToListAsync();
        var groupIds = owned.Select(group => group.GroupId).ToList();
        var candidates = await db.SportsGroupMembers.AsNoTracking()
            .Where(member => groupIds.Contains(member.SportsGroupId) && member.AppUserId != id &&
                member.Status == SportsGroupMemberStatus.Approved && member.AppUser.Status == UserAccountStatus.Active &&
                (member.Role == SportsGroupRole.Member || member.Role == SportsGroupRole.Admin))
            .OrderBy(member => member.Role).ThenBy(member => member.AppUser.DisplayName)
            .Select(member => new { member.SportsGroupId, Candidate = new OwnershipCandidateDto(member.Id, member.AppUserId,
                member.AppUser.DisplayName, EmailPrivacy.Mask(member.AppUser.Email), member.Role.ToString()) }).ToListAsync();
        return new(lastAdmin, owned.Select(group => new OwnedGroupDeletionDto(group.GroupId, group.GroupName,
            candidates.Where(candidate => candidate.SportsGroupId == group.GroupId).Select(candidate => candidate.Candidate).ToList())).ToList());
    }

    public async Task<AccountDeletionResult> DeleteAsync(Guid id, Guid actorId, DeleteAccountRequest request)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        // Share the system-admin lock with permission changes and other account deletions.
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(20661032)");
        db.ChangeTracker.Clear();
        if (!await db.Users.AnyAsync(user => user.Id == actorId && user.IsSysAdmin && user.Status == UserAccountStatus.Active))
            return new(false, "Endast aktiva systemadministratörer kan ta bort konton.");
        // FOR UPDATE also blocks new FK references: a new group/membership cannot appear
        // for this account after we collect the groups that must be locked.
        var target = await db.Users.FromSqlInterpolated($"SELECT * FROM \"AspNetUsers\" WHERE \"Id\" = {id} FOR UPDATE").SingleOrDefaultAsync();
        if (target is null) return new(false, "Kontot finns inte längre. Ladda om sidan.");
        if (target.IsSysAdmin && target.Status == UserAccountStatus.Active &&
            !await db.Users.AnyAsync(user => user.Id != id && user.IsSysAdmin && user.Status == UserAccountStatus.Active))
            return new(false, "Det sista aktiva systemadministratörskontot kan inte tas bort. Utse en annan systemadministratör först.");
        var groupIds = await db.SportsGroupMembers.AsNoTracking().Where(member => member.AppUserId == id)
            .Select(member => member.SportsGroupId).Distinct().OrderBy(groupId => groupId).ToListAsync();
        foreach (var groupId in groupIds)
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM sports_groups WHERE id = {groupId} FOR UPDATE");
        var owned = await db.SportsGroupMembers.Where(member => member.AppUserId == id &&
            member.Role == SportsGroupRole.Owner && member.Status == SportsGroupMemberStatus.Approved).ToListAsync();
        var replacements = request.OwnershipTransfers;
        if (replacements.Select(item => item.GroupId).Distinct().Count() != replacements.Count ||
            !owned.Select(member => member.SportsGroupId).ToHashSet().SetEquals(replacements.Select(item => item.GroupId)))
            return new(false, "Välj en ny ägare för varje grupp som kontot äger. Om ägarskapet ändrats, ladda om underlaget och försök igen.");
        var successors = new List<SportsGroupMember>();
        foreach (var replacement in replacements)
        {
            var successor = await db.SportsGroupMembers.SingleOrDefaultAsync(member => member.Id == replacement.MemberId &&
                member.SportsGroupId == replacement.GroupId && member.AppUserId != id &&
                member.Status == SportsGroupMemberStatus.Approved && member.AppUser.Status == UserAccountStatus.Active &&
                (member.Role == SportsGroupRole.Member || member.Role == SportsGroupRole.Admin));
            if (successor is null) return new(false, "En vald ny ägare är inte längre en aktiv, godkänd medlem i rätt grupp. Ladda om underlaget och välj igen.");
            successors.Add(successor);
        }
        // Free each unique owner slot before assigning successors, without an observable gap.
        foreach (var membership in owned) membership.Role = SportsGroupRole.Admin;
        await db.SaveChangesAsync();
        foreach (var successor in successors) successor.Role = SportsGroupRole.Owner;
        await db.SaveChangesAsync();
        var deleted = await users.DeleteAsync(target);
        if (!deleted.Succeeded) return new(false, "Kontot ändrades under borttagningen. Ladda om underlaget och försök igen.");
        // Memberships and invitations cascade; approvals are set null. Players/matches remain.
        await transaction.CommitAsync();
        return new(true);
    }
}
