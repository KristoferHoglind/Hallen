using Hallen.Api.Extensions;
using Hallen.Application.Players;
using Hallen.Application.SportsGroups;
using Hallen.Common.DTOs.Players;
using Hallen.Common.DTOs.SportsGroups;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/sports-groups")]
public class SportsGroupsController(ISportsGroupService sportsGroupService, IPlayerService playerService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<SportsGroupDto>>> GetSportsGroups()
    {
        var appUserId = User.GetUserId();

        var sportsGroups = await sportsGroupService.GetSportsGroupsAsync(appUserId);

        return Ok(sportsGroups);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SportsGroupDto>> GetSportsGroup(Guid id)
    {
        var appUserId = User.GetUserId();

        var sportsGroup = await sportsGroupService.GetSportsGroupAsync(id, appUserId);

        if (sportsGroup is null)
        {
            return NotFound();
        }

        return Ok(sportsGroup);
    }

    [HttpPost]
    public async Task<ActionResult<SportsGroupDto>> CreateSportsGroup(CreateSportsGroupRequest request)
    {
        var appUserId = User.GetUserId();

        var sportsGroup = await sportsGroupService.CreateSportsGroupAsync(
            request,
            appUserId);

        return CreatedAtAction(
            nameof(GetSportsGroup),
            new { id = sportsGroup.Id },
            sportsGroup);
    }

    [HttpGet("{sportsGroupId:guid}/players")]
    public async Task<ActionResult<List<PlayerDto>>> GetPlayersForSportsGroup(Guid sportsGroupId)
    {
        var appUserId = User.GetUserId();

        var sportsGroup = await sportsGroupService.GetSportsGroupAsync(sportsGroupId, appUserId);

        if (sportsGroup is null)
        {
            return NotFound();
        }

        var players = await playerService.GetPlayersBySportsGroupAsync(sportsGroupId, appUserId);

        return Ok(players);
    }

    [HttpPost("{sportsGroupId:guid}/players")]
    public async Task<ActionResult<PlayerDto>> CreatePlayerForSportsGroup(Guid sportsGroupId, CreatePlayerRequest request)
    {
        var appUserId = User.GetUserId();

        var sportsGroup = await sportsGroupService.GetSportsGroupAsync(sportsGroupId, appUserId);

        if (sportsGroup is null)
        {
            return NotFound();
        }

        var player = await playerService.CreatePlayerForSportsGroupAsync(sportsGroupId, request, appUserId);

        return CreatedAtAction(
            nameof(GetPlayersForSportsGroup),
            new { sportsGroupId },
            player);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSportsGroup(Guid id, UpdateSportsGroupRequest request)
    {
        var appUserId = User.GetUserId();

        var wasUpdated = await sportsGroupService.UpdateSportsGroupAsync(id, request, appUserId);

        if (!wasUpdated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSportsGroup(Guid id)
    {
        var appUserId = User.GetUserId();

        var wasDeleted = await sportsGroupService.DeleteSportsGroupAsync(id, appUserId);

        if (!wasDeleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}