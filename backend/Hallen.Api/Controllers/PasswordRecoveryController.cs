using Hallen.Common.Privacy;
using System.ComponentModel.DataAnnotations;
using Hallen.Api.Extensions;
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
[Route("api/password-recovery")]
public class PasswordRecoveryController(UserManager<AppUser> users, HallenDbContext db) : ControllerBase
{
    private async Task<bool> IsAdmin() => await users.GetUserAsync(User) is { IsSysAdmin: true, Status: UserAccountStatus.Active };

    [HttpGet("users")]
    public async Task<IActionResult> List()
    {
        if (!await IsAdmin()) return Forbid();
        return Ok(await db.Users.AsNoTracking().OrderBy(user => user.DisplayName)
            .Select(user => new { user.Id, user.DisplayName, Email = EmailPrivacy.Mask(user.Email), active = user.Status == UserAccountStatus.Active }).ToListAsync());
    }

    [HttpPost("users/{id:guid}")]
    [EnableRateLimiting("invitations")]
    public async Task<IActionResult> Create(Guid id)
    {
        if (!await IsAdmin()) return Forbid();
        var user = await users.FindByIdAsync(id.ToString());
        if (user is null || user.Status != UserAccountStatus.Active) return BadRequest("Kontot är inte aktivt.");
        var token = await users.GeneratePasswordResetTokenAsync(user);
        return Ok(new { userId = id, token, expiresAt = DateTimeOffset.UtcNow.AddHours(1) });
    }

    [HttpPost("groups/{groupId:guid}/users/{id:guid}")]
    [EnableRateLimiting("invitations")]
    public async Task<IActionResult> CreateForGroup(Guid groupId, Guid id)
    {
        var issuer = await users.GetUserAsync(User);
        if (issuer is null || issuer.Status != UserAccountStatus.Active) return Forbid();
        var membership = await db.SportsGroupMembers.AsNoTracking().SingleOrDefaultAsync(member =>
            member.SportsGroupId == groupId && member.AppUserId == issuer.Id && member.Status == SportsGroupMemberStatus.Approved);
        var target = await db.SportsGroupMembers.AsNoTracking().SingleOrDefaultAsync(member =>
            member.SportsGroupId == groupId && member.AppUserId == id && member.Status == SportsGroupMemberStatus.Approved);
        if (membership is null || target is null ||
            !(membership.Role == SportsGroupRole.Owner || membership.Role == SportsGroupRole.Admin && target.Role == SportsGroupRole.Member))
            return Forbid();
        var user = await users.FindByIdAsync(id.ToString());
        if (user is null || user.Status != UserAccountStatus.Active || user.IsSysAdmin) return Forbid();
        var token = await users.GeneratePasswordResetTokenAsync(user);
        return Ok(new { userId = id, token, expiresAt = DateTimeOffset.UtcNow.AddHours(1) });
    }

    [HttpPost("reset")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Reset(ResetPasswordRequest request)
    {
        const string invalid = "Återställningslänken är ogiltig, använd eller har gått ut. Be om en ny länk.";
        await using var transaction = await db.Database.BeginTransactionAsync();
        // Serialize resets for this account so concurrent requests cannot reuse a token.
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({request.UserId.ToString()}, 0))");
        // Cookie validation may already have loaded this account before we acquired the lock.
        db.ChangeTracker.Clear();
        var user = await users.FindByIdAsync(request.UserId.ToString());
        if (user is null || user.Status != UserAccountStatus.Active) return BadRequest(invalid);
        var result = await users.ResetPasswordAsync(user, request.Token, request.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors.Any(error => error.Code == "InvalidToken")
                ? invalid : "Lösenordet måste innehålla minst 8 tecken, en liten bokstav och en siffra.");
        await users.SetLockoutEndDateAsync(user, null);
        await users.ResetAccessFailedCountAsync(user);
        await transaction.CommitAsync();
        return NoContent();
    }
}

public class ResetPasswordRequest
{
    public Guid UserId { get; set; }
    [Required, StringLength(4096)] public string Token { get; set; } = "";
    [Required, StringLength(128, MinimumLength = 8)] public string Password { get; set; } = "";
}
