namespace Hallen.Common.DTOs.Auth;

public class CurrentUserDto
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public bool IsSysAdmin { get; set; }

    public string Status { get; set; } = string.Empty;
}