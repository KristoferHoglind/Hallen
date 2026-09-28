using Hallen.Database.Models;

namespace Hallen.Database.Entities;

public class SportsGroupMember
{
    public Guid Id { get; set; }

    public Guid SportsGroupId { get; set; }
    public SportsGroup SportsGroup { get; set; } = null!;

    public Guid AppUserId { get; set; }
    public AppUser AppUser { get; set; } = null!;

    public SportsGroupRole Role { get; set; }

    public SportsGroupMemberStatus Status { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? ApprovedAt { get; set; }

    public Guid? ApprovedByUserId { get; set; }
    public AppUser? ApprovedByUser { get; set; }
}