namespace Hallen.Database.Models;

public class GameMatch
{
    public Guid Id { get; set; }

    public string Name { get; set; } = "Match";

    public Guid GameSessionId { get; set; }
    public GameSession GameSession { get; set; } = null!;

    public int MatchNumber { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? FinishedAt { get; set; }

    public List<GameMatchTeamResult> TeamResults { get; set; } = [];

    public List<GameMatchTeamPlayer> TeamPlayers { get; set; } = [];
}