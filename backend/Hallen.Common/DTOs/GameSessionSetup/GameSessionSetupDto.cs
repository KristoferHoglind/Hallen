namespace Hallen.Common.DTOs.GameSessionSetup;

public class GameSessionSetupDto
{
    public Guid GameSessionId { get; set; }

    public string GameSessionName { get; set; } = string.Empty;

    public DateTimeOffset StartsAt { get; set; }

    public Guid SportsGroupId { get; set; }

    public List<GameSessionParticipantDto> Participants { get; set; } = [];

    public List<GameSessionTeamDto> Teams { get; set; } = [];
}