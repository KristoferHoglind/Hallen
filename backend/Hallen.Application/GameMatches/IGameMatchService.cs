using Hallen.Common.DTOs.GameMatches;

namespace Hallen.Application.GameMatches;

public interface IGameMatchService
{
    Task<List<GameMatchDto>> GetByGameSessionIdAsync(Guid gameSessionId, Guid appUserId);

    Task<GameMatchDto?> GetByIdAsync(Guid id, Guid appUserId);

    Task<GameMatchDto?> CreateAsync(Guid gameSessionId, CreateGameMatchRequest request, Guid appUserId);

    Task<GameMatchDto?> UpdateAsync(Guid id, UpdateGameMatchRequest request, Guid appUserId);

    Task<bool> DeleteAsync(Guid id, Guid appUserId);
}