namespace Hallen.Common.DTOs.GameSessions;

public class CreateGameSessionRequest
{
    public string Name { get; set; } = string.Empty;

    public DateTimeOffset StartsAt { get; set; }

    public int NumberOfTeams { get; set; }

    public List<Guid> PlayerIds { get; set; } = [];
}