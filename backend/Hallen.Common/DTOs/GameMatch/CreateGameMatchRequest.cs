public class CreateGameMatchRequest
{
    public string? Name { get; set; }

    public List<CreateGameMatchTeamResultRequest> TeamResults { get; set; } = [];
}