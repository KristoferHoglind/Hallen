using System.ComponentModel.DataAnnotations;

namespace Hallen.Common.DTOs.Invitations;

public class CreateInvitationRequest
{
    [Required, RegularExpression("^(Member|Admin)$")]
    public string Role { get; set; } = "Member";
}

public class InvitationTokenRequest
{
    [Required, StringLength(64, MinimumLength = 64), RegularExpression("^[a-fA-F0-9]+$")]
    public string Token { get; set; } = string.Empty;
}

public record InvitationDto(Guid Id, Guid? SportsGroupId, string? GroupName, string Role,
    DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt, bool IsUsed, bool IsRevoked);
public record CreatedInvitationDto(InvitationDto Invitation, string Token);
