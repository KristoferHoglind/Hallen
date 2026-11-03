using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Security.Claims;
using System.Text.Encodings.Web;
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
[Route("api/security/two-factor")]
[EnableRateLimiting("security")]
public class TwoFactorController(UserManager<AppUser> users, SignInManager<AppUser> signIn, HallenDbContext db) : ControllerBase
{
    public class VerifyRequest {
        [Required, StringLength(128)] public string Password { get; set; } = "";
        [StringLength(100)] public string Code { get; set; } = "";
    }
    private bool RecentRecovery() => long.TryParse(User.FindFirstValue("Hallen.RecoveryLoginAt"), out var time) &&
        DateTimeOffset.UtcNow.ToUnixTimeSeconds() - time is >= 0 and <= 300;
    [HttpGet]
    public async Task<IActionResult> Status() {
        var user = await users.GetUserAsync(User);
        if (user is null || user.Status != UserAccountStatus.Active) return Unauthorized();
        return Ok(new {enabled=user.TwoFactorEnabled,canResetFromRecovery=RecentRecovery(),recoveryCodesLeft=await users.CountRecoveryCodesAsync(user)});
    }
    private async Task<AppUser?> Reauthenticate(string password) {
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({User.GetUserId().ToString()}, 0))");
        db.ChangeTracker.Clear();
        var user = await users.FindByIdAsync(User.GetUserId().ToString());
        if (user is null || user.Status != UserAccountStatus.Active || await users.IsLockedOutAsync(user)) return null;
        if (!await users.CheckPasswordAsync(user,password)) { await users.AccessFailedAsync(user); return null; }
        return user;
    }
    [HttpPost("setup")]
    public async Task<IActionResult> Setup(VerifyRequest request) {
        await using var transaction = await db.Database.BeginTransactionAsync();
        var user = await Reauthenticate(request.Password);
        if (user is null) { await transaction.CommitAsync(); return BadRequest("Lösenordet är fel eller kontot är tillfälligt låst."); }
        if (user.TwoFactorEnabled) return Conflict("Tvåfaktorsinloggning är redan aktiverad.");
        var key = await users.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrWhiteSpace(key)) { var reset=await users.ResetAuthenticatorKeyAsync(user); if (!reset.Succeeded) return BadRequest(); key=await users.GetAuthenticatorKeyAsync(user); }
        // A key reset changes the security stamp; keep this session usable, revoke others.
        await signIn.RefreshSignInAsync(user);
        await transaction.CommitAsync();
        var label = Uri.EscapeDataString($"Hallen:{user.Email}");
        return Ok(new {sharedKey=key,authenticatorUri=$"otpauth://totp/{label}?secret={key}&issuer=Hallen&digits=6"});
    }
    [HttpPost("enable")]
    public async Task<IActionResult> Enable(VerifyRequest request) {
        await using var transaction = await db.Database.BeginTransactionAsync();
        var user = await Reauthenticate(request.Password);
        if (user is null) { await transaction.CommitAsync(); return BadRequest("Lösenordet är fel eller kontot är tillfälligt låst."); }
        if (user.TwoFactorEnabled) return Conflict("Tvåfaktorsinloggning är redan aktiverad.");
        var code=request.Code.Replace(" ","").Replace("-","");
        if (!await users.VerifyTwoFactorTokenAsync(user,users.Options.Tokens.AuthenticatorTokenProvider,code)) {
            await users.AccessFailedAsync(user); await transaction.CommitAsync(); return BadRequest("Engångskoden är fel eller har gått ut.");
        }
        var enabled=await users.SetTwoFactorEnabledAsync(user,true); if (!enabled.Succeeded) return BadRequest();
        var codes=await users.GenerateNewTwoFactorRecoveryCodesAsync(user,10);
        await users.ResetAccessFailedCountAsync(user);
        await users.UpdateSecurityStampAsync(user);
        await signIn.RefreshSignInAsync(user);
        await transaction.CommitAsync();
        return Ok(new {recoveryCodes=codes});
    }
    [HttpPost("disable")]
    public async Task<IActionResult> Disable(VerifyRequest request) {
        await using var transaction = await db.Database.BeginTransactionAsync();
        var user = await Reauthenticate(request.Password);
        if (user is null) { await transaction.CommitAsync(); return BadRequest("Lösenordet är fel eller kontot är tillfälligt låst."); }
        if (!user.TwoFactorEnabled) return BadRequest("Tvåfaktorsinloggning är inte aktiverad.");
        var code=request.Code.Replace(" ","").Replace("-","");
        if (!RecentRecovery() && !await users.VerifyTwoFactorTokenAsync(user,users.Options.Tokens.AuthenticatorTokenProvider,code)) {
            await users.AccessFailedAsync(user); await transaction.CommitAsync(); return BadRequest("Engångskoden är fel eller har gått ut.");
        }
        await users.SetTwoFactorEnabledAsync(user,false);
        await users.ResetAuthenticatorKeyAsync(user);
        await users.GenerateNewTwoFactorRecoveryCodesAsync(user,0);
        await users.ResetAccessFailedCountAsync(user);
        await users.UpdateSecurityStampAsync(user);
        await signIn.RefreshSignInAsync(user);
        await transaction.CommitAsync(); return NoContent();
    }
}
