namespace Hallen.Database.Models;

public class Player
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Guid SportsGroupId { get; set; }

    public SportsGroup? SportsGroup { get; set; }

    public List<GameTeamPlayer> GameTeamPlayers { get; set; } = [];

    public List<GameSessionPlayer> GameSessionPlayers { get; set; } = [];

    public List<GameMatchTeamPlayer> GameMatchTeamPlayers { get; set; } = [];
}