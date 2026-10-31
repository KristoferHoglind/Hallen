public class CreateGameMatchRequest
{
    public Guid? WinnerGameTeamId { get; set; }

    public string? Name { get; set; }

    public List<CreateGameMatchTeamResultRequest> TeamResults { get; set; } = [];
}