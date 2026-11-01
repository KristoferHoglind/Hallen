using Hallen.Api.Extensions;
using Hallen.Application.Invitations;
using Hallen.Common.DTOs.Invitations;
using Hallen.Database.Data;
using Hallen.Database.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Api.Controllers;

[ApiController]
[Authorize]
public class InvitationsController(InvitationService invitations, HallenDbContext db, UserManager<AppUser> users) : ControllerBase
{
    private const string InvalidInvitation = "Inbjudningslänken är ogiltig, använd, återkallad eller har gått ut. Be om en ny länk.";

    [HttpPost("api/sports-groups/{groupId:guid}/invitations")]
    [EnableRateLimiting("invitations")]
    public async Task<ActionResult<CreatedInvitationDto>> Create(Guid groupId, CreateInvitationRequest request)
    {
        var result = await invitations.CreateAsync(groupId, request.Role, User.GetUserId());
        return result is null ? Forbid() : Ok(result);
    }

    [HttpGet("api/sports-groups/{groupId:guid}/invitations")]
    public async Task<ActionResult<List<InvitationDto>>> List(Guid groupId)
    {
        var result = await invitations.ListAsync(groupId, User.GetUserId());
        return result is null ? Forbid() : Ok(result);
    }

    [HttpDelete("api/sports-groups/{groupId:guid}/invitations/{id:guid}")]
    public async Task<IActionResult> Revoke(Guid groupId, Guid id) =>
        await invitations.RevokeAsync(groupId, id, User.GetUserId()) ? NoContent() : BadRequest("Kunde inte återkalla inbjudan.");

    // The token is in the request body, never the request URL or access logs.
    [HttpPost("api/invitations/preview")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<InvitationDto>> Preview(InvitationTokenRequest request)
    {
        var invitation = await invitations.FindValidAsync(request.Token);
        return invitation is null ? BadRequest(InvalidInvitation) : Ok(InvitationService.ToDto(invitation));
    }

    [HttpPost("api/invitations/accept")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Accept(InvitationTokenRequest request)
    {
        var user = await users.GetUserAsync(User);
        if (user is null || user.Status != UserAccountStatus.Active) return Forbid();
        await using var transaction = await db.Database.BeginTransactionAsync();
        var invitation = await invitations.FindValidAsync(request.Token, lockRow: true);
        if (invitation is null) return BadRequest(InvalidInvitation);
        if (invitation.SportsGroupId is null) return BadRequest("Du har redan ett Hallen-konto. Den här länken är till för att skapa ett nytt konto.");
        // Different invitations to the same group must not race the unique membership index.
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({invitation.SportsGroupId.ToString() + user.Id}, 0))");
        if (!await invitations.AddMembershipAsync(invitation, user.Id)) return BadRequest("Du är redan eller har tidigare varit medlem i gruppen. Be gruppägaren hantera ditt medlemskap.");
        await transaction.CommitAsync();
        return Ok(new { invitation.SportsGroupId });
    }
}
