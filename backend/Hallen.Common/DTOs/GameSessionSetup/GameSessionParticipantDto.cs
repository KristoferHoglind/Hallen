namespace Hallen.Common.DTOs.GameSessionSetup;

public class GameSessionParticipantDto
{
    public Guid PlayerId { get; set; }

    public string PlayerName { get; set; } = string.Empty;

    public bool IsAssignedToTeam { get; set; }

    public Guid? GameTeamId { get; set; }
}