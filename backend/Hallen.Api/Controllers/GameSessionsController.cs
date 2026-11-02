using Hallen.Api.Extensions;
using Hallen.Database.Data;
using Hallen.Application.SportsGroups;
using Microsoft.EntityFrameworkCore;
using Hallen.Application.GameSessions;
using Hallen.Common.DTOs.GameSessions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/game-sessions")]
public class GameSessionsController(IGameSessionService gameSessionService, HallenDbContext db, ISportsGroupAuthorizationService authorization) : ControllerBase
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

    public record SessionStatusRequest(bool IsClosed);

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, SessionStatusRequest request)
    {
        if (!await authorization.CanManageGameSessionAsync(id, User.GetUserId())) return Forbid();
        var session = await db.GameSessions.FindAsync(id);
        if (session is null) return NotFound();
        session.IsClosed = request.IsClosed;
        await db.SaveChangesAsync();
        return Ok(new { session.IsClosed });
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