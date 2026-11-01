using Hallen.Database.Models;

namespace Hallen.Database.Entities;

public class GroupInvitation
{
    public Guid Id { get; set; }
    public Guid? SportsGroupId { get; set; }
    public SportsGroup? SportsGroup { get; set; }
    public Guid CreatedByUserId { get; set; }
    public AppUser CreatedByUser { get; set; } = null!;
    public string TokenHash { get; set; } = string.Empty;
    public SportsGroupRole Role { get; set; } = SportsGroupRole.Member;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
}
