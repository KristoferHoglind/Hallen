using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Hallen.Api.Extensions;
using Hallen.Database.Data;
using Hallen.Database.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Api.Controllers;

[ApiController, Authorize]
[Route("api/profile")]
[EnableRateLimiting("security")]
public class ProfileController(UserManager<AppUser> users, SignInManager<AppUser> signIn, HallenDbContext db) : ControllerBase
{
    public class NameRequest
    {
        [Required, StringLength(100)] public string DisplayName { get; set; } = "";
    }

    public class PasswordRequest
    {
        [Required, StringLength(128)] public string CurrentPassword { get; set; } = "";
        [Required, StringLength(128, MinimumLength = 8)] public string NewPassword { get; set; } = "";
    }

    private async Task<AppUser?> LoadLockedUser()
    {
        // Serialize with password recovery and two-factor changes for this account.
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({User.GetUserId().ToString()}, 0))");
        db.ChangeTracker.Clear();
        var user = await users.GetUserAsync(User);
        if (user is null || user.Status != UserAccountStatus.Active) return null;
        // Authentication ran before the lock; reject sessions revoked while waiting.
        var stamp = User.FindFirstValue(users.Options.ClaimsIdentity.SecurityStampClaimType);
        return stamp == user.SecurityStamp ? user : null;
    }

    [HttpPut]
    public async Task<IActionResult> UpdateName(NameRequest request)
    {
        var name = request.DisplayName.Trim();
        if (string.IsNullOrWhiteSpace(name)) return BadRequest("Ange ett profilnamn.");
        await using var transaction = await db.Database.BeginTransactionAsync();
        var user = await LoadLockedUser();
        if (user is null) return Unauthorized();
        user.DisplayName = name;
        var result = await users.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest("Kunde inte spara profilnamnet. Försök igen.");
        await transaction.CommitAsync();
        return NoContent();
    }

    [HttpPost("password")]
    public async Task<IActionResult> ChangePassword(PasswordRequest request)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        var user = await LoadLockedUser();
        if (user is null) return Unauthorized();
        var verified = await signIn.CheckPasswordSignInAsync(user, request.CurrentPassword, lockoutOnFailure: true);
        if (!verified.Succeeded)
        {
            await transaction.CommitAsync();
            return BadRequest("Nuvarande lösenord är fel eller kontot är tillfälligt låst.");
        }
        if (request.CurrentPassword == request.NewPassword)
            return BadRequest("Välj ett annat lösenord än ditt nuvarande.");
        var result = await users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            return BadRequest("Lösenordet måste innehålla minst 8 tecken, en liten bokstav och en siffra.");
        await transaction.CommitAsync();
        // Password changes rotate the security stamp, revoking all other sessions.
        await signIn.RefreshSignInAsync(user);
        return NoContent();
    }
}
