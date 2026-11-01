using Hallen.Application.Invitations;
using Hallen.Database.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Hallen.Common.DTOs.Auth;
using Hallen.Database.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Hallen.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager, HallenDbContext db,
    InvitationService invitations, IConfiguration configuration) : ControllerBase
{
    [HttpGet("registration")]
    [AllowAnonymous]
    public async Task<IActionResult> RegistrationStatus() => Ok(new
    {
        bootstrapAllowed = configuration.GetValue<bool>("Registration:AllowBootstrap") && !await db.Users.AnyAsync()
    });

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<CurrentUserDto>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim();
        var displayName = request.DisplayName.Trim();

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            return BadRequest("Display name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Password is required.");
        }

        await using var transaction = await db.Database.BeginTransactionAsync();
        GroupInvitation? invitation = null;
        var isBootstrap = false;
        if (!string.IsNullOrWhiteSpace(request.InvitationToken))
        {
            invitation = await invitations.FindValidAsync(request.InvitationToken, lockRow: true);
            if (invitation is null) return BadRequest("Inbjudningslänken är ogiltig, använd, återkallad eller har gått ut. Be om en ny länk.");
        }
        else
        {
            if (!configuration.GetValue<bool>("Registration:AllowBootstrap"))
                return BadRequest("Du behöver en inbjudningslänk för att skapa konto i Hallen.");
            await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(20661031)");
            if (await db.Users.AnyAsync()) return BadRequest("Du behöver en inbjudningslänk för att skapa konto i Hallen.");
            isBootstrap = true;
        }

        var user = new AppUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName,
            CreatedAt = DateTimeOffset.UtcNow,
            IsSysAdmin = isBootstrap,
            CanCreateGroups = isBootstrap || invitation is { SportsGroupId: null },
            Status = UserAccountStatus.Active,
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors.Select(error => error.Description));
        }

        if (invitation is not null) await invitations.AddMembershipAsync(invitation, user.Id);
        await transaction.CommitAsync();
        await signInManager.SignInAsync(user, isPersistent: true);

        return Ok(ToDto(user));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<CurrentUserDto>> Login(LoginRequest request)
    {
        var email = request.Email.Trim();

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Password is required.");
        }

        var user = await userManager.FindByEmailAsync(email);

        if (user is null || user.Status != UserAccountStatus.Active)
        {
            return Unauthorized("Invalid email or password.");
        }

        var result = await signInManager.PasswordSignInAsync(
            user,
            request.Password,
            isPersistent: true,
            lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            return Unauthorized("Invalid email or password.");
        }

        return Ok(ToDto(user));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();

        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<CurrentUserDto>> Me()
    {
        var user = await userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(ToDto(user));
    }

    private static CurrentUserDto ToDto(AppUser user)
    {
        return new CurrentUserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            DisplayName = user.DisplayName,
            IsSysAdmin = user.IsSysAdmin,
            CanCreateGroups = user.CanCreateGroups,
            Status = user.Status.ToString(),
        };
    }
}