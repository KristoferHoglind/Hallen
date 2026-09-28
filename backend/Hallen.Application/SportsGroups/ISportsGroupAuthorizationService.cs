using Hallen.Database.Entities;

namespace Hallen.Application.SportsGroups;

public interface ISportsGroupAuthorizationService
{
    Task<bool> HasApprovedMembershipAsync(Guid sportsGroupId, Guid appUserId);

    Task<bool> CanManageSportsGroupAsync(Guid sportsGroupId, Guid appUserId);

    Task<bool> IsOwnerAsync(Guid sportsGroupId, Guid appUserId);

    Task<SportsGroupRole?> GetRoleAsync(Guid sportsGroupId, Guid appUserId);

    Task<Guid?> GetSportsGroupIdForGameSessionAsync(Guid gameSessionId);

    Task<bool> HasReadAccessToGameSessionAsync(Guid gameSessionId, Guid appUserId);

    Task<bool> CanManageGameSessionAsync(Guid gameSessionId, Guid appUserId);
}