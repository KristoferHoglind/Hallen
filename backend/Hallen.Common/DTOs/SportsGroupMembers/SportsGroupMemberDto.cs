namespace Hallen.Common.DTOs.SportsGroupMembers;

public class SportsGroupMemberDto
{
    public Guid Id { get; set; }

    public Guid SportsGroupId { get; set; }

    public Guid AppUserId { get; set; }

    public string Email { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? ApprovedAt { get; set; }
}