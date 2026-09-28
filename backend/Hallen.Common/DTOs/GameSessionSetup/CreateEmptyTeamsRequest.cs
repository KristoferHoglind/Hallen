namespace Hallen.Common.DTOs.GameSessionSetup;

public class CreateEmptyTeamsRequest
{
    public List<Guid> PlayerIds { get; set; } = [];

    public int NumberOfTeams { get; set; }
}