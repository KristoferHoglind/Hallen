using Hallen.Api.Extensions;
using Hallen.Application.GameSessionSetup;
using Hallen.Common.DTOs.GameSessionSetup;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
public class GameSessionSetupController(IGameSessionSetupService gameSessionSetupService) : ControllerBase
{
    private readonly IGameSessionSetupService gameSessionSetupService = gameSessionSetupService;

    [HttpGet("api/game-sessions/{gameSessionId:guid}/setup")]
    public async Task<ActionResult<GameSessionSetupDto>> GetSetup(Guid gameSessionId)
    {
        var appUserId = User.GetUserId();

        var setup = await gameSessionSetupService.GetSetupAsync(gameSessionId, appUserId);

        if (setup is null)
        {
            return NotFound();
        }

        return Ok(setup);
    }

    [HttpPost("api/game-sessions/{gameSessionId:guid}/teams/randomize")]
    public async Task<ActionResult<GameSessionSetupDto>> RandomizeTeams(Guid gameSessionId)
    {
        var appUserId = User.GetUserId();

        var setup = await gameSessionSetupService.RandomizeTeamsAsync(gameSessionId, appUserId);

        if (setup is null)
        {
            return BadRequest();
        }

        return Ok(setup);
    }

    [HttpPost("api/game-sessions/{gameSessionId:guid}/teams/create-empty")]
    public async Task<ActionResult<GameSessionSetupDto>> CreateEmptyTeams(Guid gameSessionId, CreateEmptyTeamsRequest request)
    {
        var appUserId = User.GetUserId();

        var setup = await gameSessionSetupService.CreateEmptyTeamsAsync(gameSessionId, request, appUserId);

        if (setup is null)
        {
            return BadRequest();
        }

        return Ok(setup);
    }

    [HttpPut("api/game-sessions/{gameSessionId:guid}/players/{playerId:guid}/team")]
    public async Task<ActionResult<GameSessionSetupDto>> MovePlayerToTeam(Guid gameSessionId, Guid playerId, MovePlayerToTeamRequest request)
    {
        var appUserId = User.GetUserId();

        var setup = await gameSessionSetupService.MovePlayerToTeamAsync(gameSessionId, playerId, request, appUserId);

        if (setup is null)
        {
            return BadRequest();
        }

        return Ok(setup);
    }
}