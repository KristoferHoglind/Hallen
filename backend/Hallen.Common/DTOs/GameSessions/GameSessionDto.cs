namespace Hallen.Common.DTOs.GameSessions;

public class GameSessionDto
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public DateTimeOffset StartsAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public Guid SportsGroupId { get; set; }

    public int NumberOfTeams { get; set; }

    public int ParticipantCount { get; set; }
}