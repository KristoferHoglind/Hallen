namespace Hallen.Database.Models;

public class GameTeam
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Guid GameSessionId { get; set; }

    public GameSession? GameSession { get; set; }

    public List<GameTeamPlayer> GameTeamPlayers { get; set; } = [];

    public List<GameMatchTeamResult> GameMatchTeamResults { get; set; } = [];

    public List<GameMatchTeamPlayer> GameMatchTeamPlayers { get; set; } = [];
}