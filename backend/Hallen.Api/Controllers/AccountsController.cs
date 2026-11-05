using Hallen.Common.Privacy;
using System.ComponentModel.DataAnnotations;
using Hallen.Application;
using Hallen.Common.DTOs.Auth;
using Npgsql;
using Hallen.Application.Invitations;
using Microsoft.AspNetCore.RateLimiting;
using Hallen.Api.Extensions;
using Hallen.Database.Data;
using Hallen.Database.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/accounts")]
public class AccountsController(HallenDbContext db, InvitationService invitations, AccountAdministrationService administration) : ControllerBase
{
    private Task<bool> IsAdmin(Guid id) => db.Users.AsNoTracking().AnyAsync(user =>
        user.Id == id && user.IsSysAdmin && user.Status == UserAccountStatus.Active);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        if (!await IsAdmin(User.GetUserId())) return Forbid();
        return Ok(await db.Users.AsNoTracking().OrderBy(user => user.DisplayName).ThenBy(user => user.Email)
            .Select(user => new { user.Id, user.DisplayName, Email = EmailPrivacy.Mask(user.Email), user.IsSysAdmin, user.CanCreateGroups,
                active = user.Status == UserAccountStatus.Active,
                memberships = user.SportsGroupMemberships.OrderBy(member => member.SportsGroup.Name)
                    .Select(member => new { groupId = member.SportsGroupId, groupName = member.SportsGroup.Name,
                        role = member.Role.ToString(), status = member.Status.ToString() }).ToList()
            }).ToListAsync());
    }

    [HttpPost("invitations")]
    [EnableRateLimiting("invitations")]
    public async Task<IActionResult> CreateInvitation()
    {
        var result = await invitations.CreateHallenAsync(User.GetUserId());
        return result is null ? Forbid() : Ok(result);
    }

    [HttpGet("invitations")]
    public async Task<IActionResult> ListInvitations()
    {
        var result = await invitations.ListHallenAsync(User.GetUserId());
        return result is null ? Forbid() : Ok(result);
    }

    [HttpDelete("invitations/{id:guid}")]
    public async Task<IActionResult> RevokeInvitation(Guid id)
    {
        if (!await IsAdmin(User.GetUserId())) return Forbid();
        return await invitations.RevokeAsync(null, id, User.GetUserId()) ? NoContent() : BadRequest("Kunde inte återkalla inbjudan.");
    }

    [HttpGet("{id:guid}/deletion")]
    public async Task<IActionResult> DeletionPlan(Guid id)
    {
        if (!await IsAdmin(User.GetUserId())) return Forbid();
        var plan = await administration.GetDeletionPlanAsync(id);
        return plan is null ? NotFound() : Ok(plan);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, DeleteAccountRequest request)
    {
        if (!await IsAdmin(User.GetUserId())) return Forbid();
        try
        {
            var result = await administration.DeleteAsync(id, User.GetUserId(), request);
            return result.Succeeded ? NoContent() : BadRequest(result.Error);
        }
        catch (Exception exception) when (exception is PostgresException { SqlState: "40P01" or "40001" } ||
            exception.InnerException is PostgresException { SqlState: "40P01" or "40001" })
        {
            return Conflict("Kontot eller gruppmedlemskap ändrades samtidigt. Ladda om underlaget och försök igen. Ingen borttagning genomfördes.");
        }
    }

    [HttpPut("{id:guid}/permissions")]
    public async Task<IActionResult> Update(Guid id, UpdateAccountPermissions request)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        // All administrator changes share a lock, including changes by different administrators.
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(20661032)");
        db.ChangeTracker.Clear();
        if (!await IsAdmin(User.GetUserId())) return Forbid();
        var target = await db.Users.SingleOrDefaultAsync(user => user.Id == id);
        if (target is null) return NotFound();
        if (request.IsSysAdmin == true && target.Status != UserAccountStatus.Active)
            return BadRequest("Endast aktiva konton kan vara systemadministratörer.");
        if (target.IsSysAdmin && target.Status == UserAccountStatus.Active && request.IsSysAdmin == false &&
            !await db.Users.AnyAsync(user => user.Id != id && user.IsSysAdmin && user.Status == UserAccountStatus.Active))
            return BadRequest("Minst en aktiv systemadministratör måste finnas kvar.");
        target.IsSysAdmin = request.IsSysAdmin!.Value;
        target.CanCreateGroups = request.CanCreateGroups!.Value;
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }
}

public class UpdateAccountPermissions
{
    [Required] public bool? IsSysAdmin { get; set; }
    [Required] public bool? CanCreateGroups { get; set; }
}
