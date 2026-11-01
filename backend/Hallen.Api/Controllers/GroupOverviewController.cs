using System.ComponentModel.DataAnnotations;
using Hallen.Api.Extensions;
using Hallen.Application.SportsGroups;
using Hallen.Database.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/sports-groups/{groupId:guid}")]
public class GroupOverviewController(HallenDbContext db, ISportsGroupAuthorizationService authorization, GroupStatisticsService statistics) : ControllerBase
{
    [HttpPut("description")]
    public async Task<IActionResult> UpdateDescription(Guid groupId, UpdateGroupDescriptionRequest request)
    {
        if (!await authorization.CanManageSportsGroupAsync(groupId, User.GetUserId())) return Forbid();
        var group = await db.SportsGroups.SingleOrDefaultAsync(group => group.Id == groupId);
        if (group is null) return NotFound();
        group.Description = request.Description.Trim();
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> Statistics(Guid groupId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate)
    {
        if (!await authorization.HasApprovedMembershipAsync(groupId, User.GetUserId())) return Forbid();
        if (fromDate is not null && toDate is not null && fromDate > toDate)
            return BadRequest("Från datum får inte vara efter till datum.");
        return Ok(await statistics.GetAsync(groupId, fromDate, toDate));
    }
}

public class UpdateGroupDescriptionRequest
{
    [Required(AllowEmptyStrings = true), MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
}
