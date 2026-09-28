using Hallen.Api.Extensions;
using Hallen.Application.GameSessions;
using Hallen.Common.DTOs.GameSessions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/game-sessions")]
public class GameSessionsController(IGameSessionService gameSessionService) : ControllerBase
{

    [HttpGet("/api/sports-groups/{sportsGroupId:guid}/game-sessions")]
    public async Task<ActionResult<List<GameSessionDto>>> GetGameSessionsForSportsGroup(Guid sportsGroupId)
    {
        var appUserId = User.GetUserId();

        var gameSessions = await gameSessionService
            .GetGameSessionsForSportsGroupAsync(sportsGroupId, appUserId);

        return Ok(gameSessions);
    }

    [HttpPost("/api/sports-groups/{sportsGroupId:guid}/game-sessions")]
    public async Task<ActionResult<GameSessionDto>> CreateGameSessionForSportsGroup(Guid sportsGroupId, CreateGameSessionRequest request)
    {
        var appUserId = User.GetUserId();

        var gameSession = await gameSessionService.CreateGameSessionForSportsGroupAsync(
            sportsGroupId,
            request,
            appUserId);

        if (gameSession is null)
        {
            return Forbid();
        }

        return CreatedAtAction(
            nameof(GetGameSession),
            new { id = gameSession.Id },
            gameSession);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GameSessionDto>> GetGameSession(Guid id)
    {
        var appUserId = User.GetUserId();

        var gameSession = await gameSessionService.GetGameSessionAsync(
            id,
            appUserId);

        if (gameSession is null)
        {
            return NotFound();
        }

        return Ok(gameSession);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateGameSession(Guid id, UpdateGameSessionRequest request)
    {
        var appUserId = User.GetUserId();

        var wasUpdated = await gameSessionService.UpdateGameSessionAsync(
            id,
            request,
            appUserId);

        if (!wasUpdated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteGameSession(Guid id)
    {
        var appUserId = User.GetUserId();

        var wasDeleted = await gameSessionService.DeleteGameSessionAsync(
            id,
            appUserId);

        if (!wasDeleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}