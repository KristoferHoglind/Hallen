namespace Hallen.Database.Models;

public class GameMatchTeamResult
{
    public Guid Id { get; set; }

    public int Score { get; set; }

    public Guid GameMatchId { get; set; }

    public GameMatch? GameMatch { get; set; }

    public Guid GameTeamId { get; set; }

    public GameTeam? GameTeam { get; set; }
}