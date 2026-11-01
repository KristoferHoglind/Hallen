using System.ComponentModel.DataAnnotations;

namespace Hallen.Common.DTOs.Auth;

public class RegisterRequest
{
    [Required, EmailAddress, StringLength(254)]
    public string Email { get; set; } = string.Empty;
    [Required, StringLength(100)]
    public string DisplayName { get; set; } = string.Empty;
    [Required, StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
    [StringLength(64)]
    public string? InvitationToken { get; set; }
}
