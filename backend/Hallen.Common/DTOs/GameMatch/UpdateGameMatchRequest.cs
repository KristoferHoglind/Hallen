namespace Hallen.Common.DTOs.GameMatches;

public class UpdateGameMatchRequest
{
    public Guid? WinnerGameTeamId { get; set; }

    public string? Name { get; set; }

    public List<UpdateGameMatchTeamResultRequest> TeamResults { get; set; } = [];
}