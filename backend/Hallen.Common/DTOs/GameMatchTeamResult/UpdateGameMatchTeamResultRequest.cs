namespace Hallen.Common.DTOs.GameMatches;

public class UpdateGameMatchTeamResultRequest
{
    public Guid GameTeamId { get; set; }

    public int Score { get; set; }
}