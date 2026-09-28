namespace Hallen.Database.Models;

public class GameTeamPlayer
{
    public Guid Id { get; set; }

    public Guid PlayerId { get; set; }

    public Player? Player { get; set; }

    public Guid GameTeamId { get; set; }

    public GameTeam? GameTeam { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}