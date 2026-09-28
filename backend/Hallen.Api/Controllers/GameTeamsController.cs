using Hallen.Application.GameTeams;
using Hallen.Common.DTOs.GameSessionSetup;
using Hallen.Common.DTOs.GameTeams;
using Microsoft.AspNetCore.Mvc;

namespace Hallen.Api.Controllers;

[ApiController]
public class GameTeamsController : ControllerBase
{
    private readonly IGameTeamService gameTeamService;

    public GameTeamsController(IGameTeamService gameTeamService)
    {
        this.gameTeamService = gameTeamService;
    }

    [HttpPut("api/game-teams/{id:guid}")]
    public async Task<ActionResult<GameSessionTeamDto>> Update(
        Guid id,
        UpdateGameTeamRequest request)
    {
        var team = await gameTeamService.UpdateAsync(id, request);

        if (team is null)
        {
            return BadRequest("Could not update team. Check that the team exists and the name is not empty.");
        }

        return Ok(team);
    }
}