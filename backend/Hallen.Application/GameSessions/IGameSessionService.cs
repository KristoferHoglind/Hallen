using Hallen.Common.DTOs.GameSessions;

namespace Hallen.Application.GameSessions;

public interface IGameSessionService
{
    Task<List<GameSessionDto>> GetGameSessionsForSportsGroupAsync(Guid sportsGroupId, Guid appUserId);

    Task<GameSessionDto?> GetGameSessionAsync(Guid id, Guid appUserId);

    Task<GameSessionDto?> CreateGameSessionForSportsGroupAsync(Guid sportsGroupId, CreateGameSessionRequest request, Guid appUserId);

    Task<bool> UpdateGameSessionAsync(Guid id, UpdateGameSessionRequest request, Guid appUserId);

    Task<bool> DeleteGameSessionAsync(Guid id, Guid appUserId);
}