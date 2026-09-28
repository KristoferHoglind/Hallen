namespace Hallen.Common.DTOs.SportsGroupMembers;

public class AddSportsGroupMemberRequest
{
    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = "Member";
}