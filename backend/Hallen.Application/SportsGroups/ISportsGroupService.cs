using Hallen.Common.DTOs.SportsGroups;

namespace Hallen.Application.SportsGroups;

public interface ISportsGroupService
{
    Task<List<SportsGroupDto>> GetSportsGroupsAsync(Guid appUserId);

    Task<SportsGroupDto?> GetSportsGroupAsync(Guid id, Guid appUserId);

    Task<SportsGroupDto> CreateSportsGroupAsync(CreateSportsGroupRequest request, Guid appUserId);

    Task<bool> UpdateSportsGroupAsync(Guid id, UpdateSportsGroupRequest request, Guid appUserId);

    Task<bool> DeleteSportsGroupAsync(Guid id, Guid appUserId);
}