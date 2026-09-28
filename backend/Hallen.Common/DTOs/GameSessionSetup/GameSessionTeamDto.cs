namespace Hallen.Common.DTOs.GameSessionSetup;

public class GameSessionTeamDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public List<GameSessionParticipantDto> Players { get; set; } = [];
}