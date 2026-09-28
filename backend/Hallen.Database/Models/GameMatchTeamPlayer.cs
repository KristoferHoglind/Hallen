namespace Hallen.Database.Models;

public class GameMatchTeamPlayer
{
    public Guid Id { get; set; }

    public Guid GameMatchId { get; set; }
    public GameMatch GameMatch { get; set; } = null!;

    public Guid GameTeamId { get; set; }
    public GameTeam GameTeam { get; set; } = null!;

    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public string PlayerName { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }
}