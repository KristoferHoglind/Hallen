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
                "Could not update member role. Check permissions and that the group keeps at least one owner.");
        }

        return Ok(member);
    }

    [HttpDelete("api/sports-groups/{sportsGroupId:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid sportsGroupId, Guid memberId)
    {
        var appUserId = User.GetUserId();

        var wasRemoved = await sportsGroupMemberService.RemoveMemberAsync(sportsGroupId, memberId, appUserId);

        if (!wasRemoved)
        {
            return BadRequest(
                "Could not remove member. Check permissions and that the group keeps at least one owner.");
        }

        return NoContent();
    }
}