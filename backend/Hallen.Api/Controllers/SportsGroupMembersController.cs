using Hallen.Api.Extensions;
using Hallen.Application.SportsGroupMembers;
using Hallen.Common.DTOs.SportsGroupMembers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
public class SportsGroupMembersController(ISportsGroupMemberService sportsGroupMemberService) : ControllerBase
{
    [HttpGet("api/sports-groups/{sportsGroupId:guid}/members")]
    public async Task<ActionResult<List<SportsGroupMemberDto>>> GetMembers(Guid sportsGroupId)
    {
        var appUserId = User.GetUserId();

        var members = await sportsGroupMemberService.GetMembersAsync(sportsGroupId, appUserId);

        return Ok(members);
    }

    [HttpPost("api/sports-groups/{sportsGroupId:guid}/members")]
    public async Task<ActionResult<SportsGroupMemberDto>> AddMember(Guid sportsGroupId, AddSportsGroupMemberRequest request)
    {
        var appUserId = User.GetUserId();

        var member = await sportsGroupMemberService.AddMemberAsync(sportsGroupId, request, appUserId);

        if (member is null)
        {
            return BadRequest(
                "Could not add member. Check that the user exists and that you have permission to add this role.");
        }

        return Ok(member);
    }

    [HttpPut("api/sports-groups/{sportsGroupId:guid}/members/{memberId:guid}/role")]
    public async Task<ActionResult<SportsGroupMemberDto>> UpdateMemberRole(Guid sportsGroupId, Guid memberId, UpdateSportsGroupMemberRoleRequest request)
    {
        var appUserId = User.GetUserId();

        var member = await sportsGroupMemberService.UpdateMemberRoleAsync(sportsGroupId, memberId, request, appUserId);

        if (member is null)
        {
            return BadRequest(
                "Kunde inte ändra rollen. Ägare och administratörer kan växla mellan Admin och Medlem. Ägarrollen kan bara ändras via Överför ägarskap.");
        }

        return Ok(member);
    }

    [HttpPost("api/sports-groups/{sportsGroupId:guid}/members/{memberId:guid}/transfer-ownership")]
    public async Task<IActionResult> TransferOwnership(Guid sportsGroupId, Guid memberId)
    {
        if (!await sportsGroupMemberService.TransferOwnershipAsync(sportsGroupId, memberId, User.GetUserId()))
            return BadRequest("Ägarskapet kunde inte överföras. Bara den nuvarande ägaren kan överföra det till en annan godkänd medlem med ett aktivt konto.");
        return NoContent();
    }

    [HttpDelete("api/sports-groups/{sportsGroupId:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid sportsGroupId, Guid memberId)
    {
        var appUserId = User.GetUserId();

        var wasRemoved = await sportsGroupMemberService.RemoveMemberAsync(sportsGroupId, memberId, appUserId);

        if (!wasRemoved)
        {
            return BadRequest(
                "Kunde inte ta bort medlemmen. Ägaren kan inte tas bort; överför ägarskapet först.");
        }

        return NoContent();
    }
}