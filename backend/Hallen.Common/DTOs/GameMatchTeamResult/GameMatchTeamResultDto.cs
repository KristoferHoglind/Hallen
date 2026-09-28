using Hallen.Common.DTOs.GameMatches;

public class GameMatchTeamResultDto
{
    public Guid GameTeamId { get; set; }

    public string GameTeamName { get; set; } = string.Empty;

    public int Score { get; set; }

    public List<GameMatchTeamPlayerDto> Players { get; set; } = [];
}