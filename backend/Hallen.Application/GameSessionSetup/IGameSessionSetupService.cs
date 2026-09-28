using Hallen.Common.DTOs.GameSessionSetup;

namespace Hallen.Application.GameSessionSetup;

public interface IGameSessionSetupService
{
    Task<GameSessionSetupDto?> GetSetupAsync(Guid gameSessionId, Guid appUserId);

    Task<GameSessionSetupDto?> RandomizeTeamsAsync(Guid gameSessionId, Guid appUserId);

    Task<GameSessionSetupDto?> CreateEmptyTeamsAsync(Guid gameSessionId, CreateEmptyTeamsRequest request, Guid appUserId);

    Task<GameSessionSetupDto?> MovePlayerToTeamAsync(Guid gameSessionId, Guid playerId, MovePlayerToTeamRequest request, Guid appUserId);
}