namespace Hallen.Common.DTOs.GameMatches;

public class UpdateGameMatchRequest
{
    public string? Name { get; set; }

    public List<UpdateGameMatchTeamResultRequest> TeamResults { get; set; } = [];
}