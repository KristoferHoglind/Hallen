using Microsoft.AspNetCore.Identity;

namespace Hallen.Database.Entities;

public class AppUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;

    public bool IsSysAdmin { get; set; }

    public UserAccountStatus Status { get; set; } = UserAccountStatus.Active;

    public DateTimeOffset CreatedAt { get; set; }

    public List<SportsGroupMember> SportsGroupMemberships { get; set; } = [];

    public List<SportsGroupMember> ApprovedSportsGroupMemberships { get; set; } = [];
}