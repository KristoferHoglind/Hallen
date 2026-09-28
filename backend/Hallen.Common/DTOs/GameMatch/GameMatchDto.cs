public class GameMatchDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public Guid GameSessionId { get; set; }

    public int MatchNumber { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? FinishedAt { get; set; }

    public List<GameMatchTeamResultDto> TeamResults { get; set; } = [];
}