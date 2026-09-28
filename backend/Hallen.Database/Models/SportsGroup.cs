using Hallen.Database.Entities;

namespace Hallen.Database.Models;

public class SportsGroup
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public List<Player> Players { get; set; } = [];

    public List<GameSession> GameSessions { get; set; } = [];

    public List<SportsGroupMember> Members { get; set; } = [];
}