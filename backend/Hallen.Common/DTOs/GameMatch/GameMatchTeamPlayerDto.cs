namespace Hallen.Common.DTOs.GameMatches;

public class GameMatchTeamPlayerDto
{
    public Guid PlayerId { get; set; }

    public string PlayerName { get; set; } = string.Empty;
}