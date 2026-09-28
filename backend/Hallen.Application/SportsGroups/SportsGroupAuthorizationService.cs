using Hallen.Database.Data;
using Hallen.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.SportsGroups;

public class SportsGroupAuthorizationService(HallenDbContext dbContext)
    : ISportsGroupAuthorizationService
{
    public async Task<bool> HasApprovedMembershipAsync(Guid sportsGroupId, Guid appUserId)
    {
        return await dbContext.SportsGroupMembers.AnyAsync(member =>
            member.SportsGroupId == sportsGroupId &&
            member.AppUserId == appUserId &&
            member.Status == SportsGroupMemberStatus.Approved);
    }

    public async Task<bool> CanManageSportsGroupAsync(Guid sportsGroupId, Guid appUserId)
    {
        return await dbContext.SportsGroupMembers.AnyAsync(member =>
            member.SportsGroupId == sportsGroupId &&
            member.AppUserId == appUserId &&
            member.Status == SportsGroupMemberStatus.Approved &&
            (member.Role == SportsGroupRole.Owner ||
             member.Role == SportsGroupRole.Admin));
    }

    public async Task<bool> IsOwnerAsync(Guid sportsGroupId, Guid appUserId)
    {
        return await dbContext.SportsGroupMembers.AnyAsync(member =>
            member.SportsGroupId == sportsGroupId &&
            member.AppUserId == appUserId &&
            member.Status == SportsGroupMemberStatus.Approved &&
            member.Role == SportsGroupRole.Owner);
    }

    public async Task<SportsGroupRole?> GetRoleAsync(Guid sportsGroupId, Guid appUserId)
    {
        return await dbContext.SportsGroupMembers
            .Where(member =>
                member.SportsGroupId == sportsGroupId &&
                member.AppUserId == appUserId &&
                member.Status == SportsGroupMemberStatus.Approved)
            .Select(member => (SportsGroupRole?)member.Role)
            .FirstOrDefaultAsync();
    }

    public async Task<Guid?> GetSportsGroupIdForGameSessionAsync(Guid gameSessionId)
    {
        return await dbContext.GameSessions
            .Where(gameSession => gameSession.Id == gameSessionId)
            .Select(gameSession => (Guid?)gameSession.SportsGroupId)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> HasReadAccessToGameSessionAsync(Guid gameSessionId, Guid appUserId)
    {
        var sportsGroupId = await GetSportsGroupIdForGameSessionAsync(gameSessionId);

        if (sportsGroupId is null)
        {
            return false;
        }

        return await HasApprovedMembershipAsync(sportsGroupId.Value, appUserId);
    }

    public async Task<bool> CanManageGameSessionAsync(Guid gameSessionId, Guid appUserId)
    {
        var sportsGroupId = await GetSportsGroupIdForGameSessionAsync(gameSessionId);

        if (sportsGroupId is null)
        {
            return false;
        }

        return await CanManageSportsGroupAsync(sportsGroupId.Value, appUserId);
    }
}