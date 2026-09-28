namespace Hallen.Common.DTOs.Players;

public class PlayerDto
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public Guid SportsGroupId { get; set; }
}