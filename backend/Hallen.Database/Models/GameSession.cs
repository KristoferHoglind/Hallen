namespace Hallen.Database.Models;

public class GameSession
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public DateTimeOffset StartsAt { get; set; }

    public int NumberOfTeams { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public Guid SportsGroupId { get; set; }

    public SportsGroup SportsGroup { get; set; } = null!;

    public List<GameTeam> GameTeams { get; set; } = [];

    public List<GameMatch> GameMatches { get; set; } = [];

    public List<GameSessionPlayer> GameSessionPlayers { get; set; } = [];
}