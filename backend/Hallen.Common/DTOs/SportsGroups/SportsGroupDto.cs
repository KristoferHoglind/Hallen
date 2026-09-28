namespace Hallen.Common.DTOs.SportsGroups;

public class SportsGroupDto
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public string CurrentUserRole { get; set; } = string.Empty;

    public bool CanManage { get; set; }

    public bool IsOwner { get; set; }
}