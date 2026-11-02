namespace Hallen.Database.Models;

public class SessionTemplate
{
    public Guid Id { get; set; }
    public Guid SportsGroupId { get; set; }
    public SportsGroup SportsGroup { get; set; } = null!;
    public string Name { get; set; } = "";
    public int Weekday { get; set; }
    public string Time { get; set; } = "16:00";
    public int NumberOfTeams { get; set; }
    public string[] TeamNames { get; set; } = [];
}
