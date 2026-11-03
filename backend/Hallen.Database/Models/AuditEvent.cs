namespace Hallen.Database.Models;

public class AuditEvent
{
    public Guid Id { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Guid? ActorUserId { get; set; }
    public string EntityType { get; set; } = "";
    public string EntityId { get; set; } = "";
    public string Action { get; set; } = "";
    public string[] ChangedFields { get; set; } = [];
}
