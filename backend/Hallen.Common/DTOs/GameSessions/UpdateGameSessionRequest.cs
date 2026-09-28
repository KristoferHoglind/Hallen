namespace Hallen.Common.DTOs.GameSessions;

public class UpdateGameSessionRequest
{
    public string Name { get; set; } = string.Empty;

    public DateTimeOffset StartsAt { get; set; }
}