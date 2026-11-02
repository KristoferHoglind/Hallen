using Hallen.Api.Extensions;
using Hallen.Application.SportsGroups;
using Hallen.Database.Data;
using Hallen.Database.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Api.Controllers;

[ApiController, Authorize]
[Route("api/sports-groups/{groupId:guid}/session-templates")]
public class SessionTemplatesController(HallenDbContext db, ISportsGroupAuthorizationService authorization) : ControllerBase
{
    public record TemplateRequest(string Name, int Weekday, string Time, int NumberOfTeams, string[] TeamNames);

    [HttpGet]
    public async Task<IActionResult> List(Guid groupId)
    {
        if (!await authorization.HasApprovedMembershipAsync(groupId, User.GetUserId())) return Forbid();
        return Ok(await db.SessionTemplates.AsNoTracking().Where(x => x.SportsGroupId == groupId)
            .OrderBy(x => x.Name).Select(x => new { x.Id, x.Name, x.Weekday, x.Time, x.NumberOfTeams, x.TeamNames }).ToListAsync());
    }

    [HttpPost]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Save(Guid groupId, TemplateRequest request, Guid? id = null)
    {
        if (!await authorization.CanManageSportsGroupAsync(groupId, User.GetUserId())) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 200 || request.Weekday is < 0 or > 6 ||
            !TimeOnly.TryParseExact(request.Time, "HH:mm", out _) || request.NumberOfTeams is < 2 or > 32 ||
            request.TeamNames is null || request.TeamNames.Length != request.NumberOfTeams || request.TeamNames.Any(x => string.IsNullOrWhiteSpace(x) || x.Length > 100))
            return BadRequest();
        var template = id.HasValue ? await db.SessionTemplates.SingleOrDefaultAsync(x => x.Id == id && x.SportsGroupId == groupId) : new SessionTemplate { Id = Guid.NewGuid(), SportsGroupId = groupId };
        if (template is null) return NotFound();
        template.Name = request.Name.Trim(); template.Weekday = request.Weekday; template.Time = request.Time;
        template.NumberOfTeams = request.NumberOfTeams; template.TeamNames = request.TeamNames.Select(x => x.Trim()).ToArray();
        if (!id.HasValue) db.SessionTemplates.Add(template);
        await db.SaveChangesAsync();
        return Ok(new { template.Id, template.Name, template.Weekday, template.Time, template.NumberOfTeams, template.TeamNames });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid groupId, Guid id)
    {
        if (!await authorization.CanManageSportsGroupAsync(groupId, User.GetUserId())) return Forbid();
        var template = await db.SessionTemplates.SingleOrDefaultAsync(x => x.Id == id && x.SportsGroupId == groupId);
        if (template is null) return NotFound();
        db.SessionTemplates.Remove(template); await db.SaveChangesAsync(); return NoContent();
    }
}
