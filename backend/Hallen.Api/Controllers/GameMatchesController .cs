using Hallen.Api.Extensions;
using Hallen.Application.GameMatches;
using Hallen.Common.DTOs.GameMatches;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
public class GameMatchesController(IGameMatchService gameMatchService) : ControllerBase
{
    [HttpGet("api/game-sessions/{gameSessionId:guid}/matches")]
    public async Task<ActionResult<List<GameMatchDto>>> GetByGameSessionId(Guid gameSessionId)
    {
        var appUserId = User.GetUserId();

        var matches = await gameMatchService.GetByGameSessionIdAsync(gameSessionId, appUserId);

        return Ok(matches);
    }

    [HttpGet("api/game-matches/{id:guid}")]
    public async Task<ActionResult<GameMatchDto>> GetById(Guid id)
    {
        var appUserId = User.GetUserId();

        var match = await gameMatchService.GetByIdAsync(id, appUserId);

        if (match is null)
        {
            return NotFound();
        }

        return Ok(match);
    }

    [HttpPost("api/game-sessions/{gameSessionId:guid}/matches")]
    public async Task<ActionResult<GameMatchDto>> Create(Guid gameSessionId, CreateGameMatchRequest request)
    {
        var appUserId = User.GetUserId();

        var match = await gameMatchService.CreateAsync(gameSessionId, request, appUserId);

        if (match is null)
        {
            return BadRequest(
                "Could not create match. Check that the game session exists, at least two teams are included, and all teams belong to the game session.");
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = match.Id },
            match);
    }

    [HttpPut("api/game-matches/{id:guid}")]
    public async Task<ActionResult<GameMatchDto>> Update(Guid id, UpdateGameMatchRequest request)
    {
        var appUserId = User.GetUserId();

        var match = await gameMatchService.UpdateAsync(id, request, appUserId);

        if (match is null)
        {
            return BadRequest(
                "Could not update match. Check that the match exists, at least two teams are included, and all teams belong to the same game session.");
        }

        return Ok(match);
    }

    [HttpDelete("api/game-matches/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var appUserId = User.GetUserId();

        var deleted = await gameMatchService.DeleteAsync(id, appUserId);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}