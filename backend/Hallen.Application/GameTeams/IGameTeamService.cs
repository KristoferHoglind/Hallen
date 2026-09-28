using Hallen.Common.DTOs.GameSessionSetup;
using Hallen.Common.DTOs.GameTeams;

namespace Hallen.Application.GameTeams;

public interface IGameTeamService
{
    Task<GameSessionTeamDto?> UpdateAsync(Guid id, UpdateGameTeamRequest request);
}