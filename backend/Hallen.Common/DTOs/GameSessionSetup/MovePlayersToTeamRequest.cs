namespace Hallen.Common.DTOs.GameSessionSetup;

public class MovePlayersToTeamRequest
{
    public List<Guid> PlayerIds { get; set; } = [];
    public Guid? GameTeamId { get; set; }
}
