namespace Hallen.Database.Models;

public class GameSessionPlayer
{
    public Guid Id { get; set; }

    public Guid GameSessionId { get; set; }
    public GameSession GameSession { get; set; } = null!;

    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; }
}