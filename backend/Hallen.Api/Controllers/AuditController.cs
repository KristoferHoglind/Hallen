using Hallen.Api.Extensions;
using Hallen.Database.Data;
using Hallen.Database.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Api.Controllers;

[ApiController, Authorize]
public class AuditController(HallenDbContext db) : ControllerBase
{
    [HttpGet("api/accounts/audit")]
    public async Task<IActionResult> Get(int page = 1, int pageSize = 25)
    {
        if (!await db.Users.AnyAsync(u => u.Id == User.GetUserId() && u.IsSysAdmin && u.Status == UserAccountStatus.Active)) return Forbid();
        if (page < 1 || page > 1000000 || pageSize is not (10 or 25 or 50)) return BadRequest();
        var total = await db.AuditEvents.CountAsync();
        var events = await db.AuditEvents.AsNoTracking().OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
        var actors = await db.Users.Where(u => events.Select(e => e.ActorUserId).Contains(u.Id)).Select(u => new {u.Id,u.DisplayName}).ToDictionaryAsync(u => u.Id,u => u.DisplayName);
        return Ok(new {total,items=events.Select(e => new {e.Id,e.CreatedAt,e.ActorUserId,actorName=e.ActorUserId is Guid id ? actors.GetValueOrDefault(id,"Borttaget konto") : "Registrering",e.EntityType,e.EntityId,e.Action,e.ChangedFields})});
    }
}
