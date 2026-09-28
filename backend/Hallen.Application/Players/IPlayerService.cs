using Hallen.Common.DTOs.Players;

namespace Hallen.Application.Players;

public interface IPlayerService
{
    Task<List<PlayerDto>> GetPlayersBySportsGroupAsync(Guid sportsGroupId, Guid appUserId);

    Task<PlayerDto?> GetPlayerAsync(Guid id, Guid appUserId);

    Task<PlayerDto?> CreatePlayerForSportsGroupAsync(Guid sportsGroupId, CreatePlayerRequest request, Guid appUserId);

    Task<bool> UpdatePlayerAsync(Guid id, UpdatePlayerRequest request, Guid appUserId);

    Task<bool> DeletePlayerAsync(Guid id, Guid appUserId);
}