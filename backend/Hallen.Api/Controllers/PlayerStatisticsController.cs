using Hallen.Api.Extensions;
using Hallen.Application.SportsGroups;
using Hallen.Database.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Api.Controllers;

[ApiController, Authorize]
public class PlayerStatisticsController(HallenDbContext db, ISportsGroupAuthorizationService authorization) : ControllerBase
{
    public record FormResult(Guid MatchId, string MatchName, string SessionName, DateTimeOffset StartsAt, string Outcome);
    public class PlayerStats
    {
        public Guid PlayerId { get; set; }
        public string Name { get; set; } = "";
        public int Matches { get; set; }
        public int Wins { get; set; }
        public int Draws { get; set; }
        public int Losses => Matches - Wins - Draws;
        public List<FormResult> Form { get; set; } = [];
        public Dictionary<Guid, PartnerStats> Partners { get; set; } = [];
    }
    public class PartnerStats
    {
        public Guid PlayerId { get; set; }
        public string Name { get; set; } = "";
        public int Matches { get; set; }
        public int Wins { get; set; }
        public int Draws { get; set; }
    }

    [HttpGet("api/sports-groups/{groupId:guid}/player-statistics")]
    public async Task<IActionResult> Get(Guid groupId)
    {
        if (!await authorization.HasApprovedMembershipAsync(groupId, User.GetUserId())) return Forbid();
        var roster = await db.Players.AsNoTracking().Where(x => x.SportsGroupId == groupId).ToListAsync();
        var stats = roster.ToDictionary(x => x.Id, x => new PlayerStats { PlayerId = x.Id, Name = x.Name });
        var matches = await db.GameMatches.AsNoTracking().Where(x => x.GameSession.SportsGroupId == groupId && x.FinishedAt != null && x.TeamResults.Count == 2)
            .Include(x => x.GameSession).Include(x => x.TeamResults).Include(x => x.TeamPlayers).AsSplitQuery()
            .OrderBy(x => x.GameSession.StartsAt).ThenBy(x => x.MatchNumber).ThenBy(x => x.Id).ToListAsync();
        foreach (var match in matches)
        {
            var results = match.TeamResults.OrderByDescending(x => x.Score).ToList();
            var winner = match.WinnerGameTeamId ?? (results[0].Score > results[1].Score ? results[0].GameTeamId : (Guid?)null);
            var participants = match.TeamPlayers.DistinctBy(x => x.PlayerId).Where(x => results.Any(r => r.GameTeamId == x.GameTeamId)).ToList();
            foreach (var player in participants)
            {
                if (!stats.TryGetValue(player.PlayerId, out var row)) stats[player.PlayerId] = row = new() { PlayerId = player.PlayerId, Name = player.PlayerName };
                var win = winner == player.GameTeamId;
                row.Matches++; if (win) row.Wins++; if (winner is null) row.Draws++;
                row.Form.Add(new(match.Id, match.Name, match.GameSession.Name, match.GameSession.StartsAt, win ? "V" : winner is null ? "O" : "F"));
                foreach (var partner in participants.Where(x => x.GameTeamId == player.GameTeamId && x.PlayerId != player.PlayerId))
                {
                    if (!row.Partners.TryGetValue(partner.PlayerId, out var pair)) row.Partners[partner.PlayerId] = pair = new() { PlayerId = partner.PlayerId, Name = stats.GetValueOrDefault(partner.PlayerId)?.Name ?? partner.PlayerName };
                    pair.Matches++; if (win) pair.Wins++; if (winner is null) pair.Draws++;
                }
            }
        }
        return Ok(stats.Values.OrderBy(x => x.Name).ThenBy(x => x.PlayerId).Select(x => new {
            x.PlayerId, x.Name, x.Matches, x.Wins, x.Draws, x.Losses,
            Form = x.Form.TakeLast(20),
            Partners = x.Partners.Values.OrderByDescending(p => p.Matches >= 5).ThenByDescending(p => (double)p.Wins / p.Matches).ThenByDescending(p => p.Matches).ThenBy(p => p.Name)
        }));
    }
}
