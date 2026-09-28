using Hallen.Api.Extensions;
using Hallen.Application.Players;
using Hallen.Common.DTOs.Players;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/players")]
public class PlayersController(IPlayerService playerService) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PlayerDto>> GetPlayer(Guid id)
    {
        var appUserId = User.GetUserId();

        var player = await playerService.GetPlayerAsync(id, appUserId);

        if (player is null)
        {
            return NotFound();
        }

        return Ok(player);
    }

    [HttpGet("api/sports-groups/{sportsGroupId:guid}/players")]
    public async Task<ActionResult<List<PlayerDto>>> GetPlayersForSportsGroup(Guid sportsGroupId)
    {
        var appUserId = User.GetUserId();

        var players = await playerService.GetPlayersBySportsGroupAsync(
            sportsGroupId,
            appUserId);

        return Ok(players);
    }

    [HttpPost("api/sports-groups/{sportsGroupId:guid}/players")]
    public async Task<ActionResult<PlayerDto>> CreatePlayerForSportsGroup(Guid sportsGroupId, CreatePlayerRequest request)
    {
        var appUserId = User.GetUserId();

        var player = await playerService.CreatePlayerForSportsGroupAsync(
            sportsGroupId,
            request,
            appUserId);

        if (player is null)
        {
            return Forbid();
        }

        return CreatedAtAction(
            nameof(GetPlayer),
            new { id = player.Id },
            player);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePlayer(Guid id, UpdatePlayerRequest request)
    {
        var appUserId = User.GetUserId();

        Console.WriteLine($"UpdatePlayer endpoint. PlayerId: {id}, AppUserId: {appUserId}");

        var wasUpdated = await playerService.UpdatePlayerAsync(
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
    public async Task<IActionResult> DeletePlayer(Guid id)
    {
        var appUserId = User.GetUserId();

        var wasDeleted = await playerService.DeletePlayerAsync(id, appUserId);

        if (!wasDeleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}