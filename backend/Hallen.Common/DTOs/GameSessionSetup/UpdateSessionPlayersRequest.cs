namespace Hallen.Common.DTOs.GameSessionSetup;

public class UpdateSessionPlayersRequest
{
    public List<Guid> PlayerIds { get; set; } = [];
}
