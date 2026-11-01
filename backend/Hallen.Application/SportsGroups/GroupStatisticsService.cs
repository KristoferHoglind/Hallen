using Hallen.Common.DTOs.SportsGroups;
using Hallen.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.SportsGroups;

public class GroupStatisticsService(HallenDbContext db)
{
    public async Task<GroupStatisticsDto> GetAsync(Guid groupId, DateOnly? fromDate = null, DateOnly? toDate = null)
    {
        // Match the Swedish calendar dates shown in the group overview, including DST transitions.
        var zone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm");
        var sessionQuery = db.GameSessions.Where(session => session.SportsGroupId == groupId);
        if (fromDate is DateOnly start)
        {
            var from = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(start.ToDateTime(TimeOnly.MinValue), zone));
            sessionQuery = sessionQuery.Where(session => session.StartsAt >= from);
        }
        if (toDate is DateOnly end)
        {
            var to = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(end.ToDateTime(TimeOnly.MaxValue), zone));
            sessionQuery = sessionQuery.Where(session => session.StartsAt <= to);
        }
        var sessions = await sessionQuery.CountAsync();
        var matches = await db.GameMatches.AsNoTracking()
            .Where(match => sessionQuery.Select(session => session.Id).Contains(match.GameSessionId) && match.FinishedAt != null && match.TeamResults.Count >= 2)
            .Include(match => match.GameSession)
            .Include(match => match.TeamResults).ThenInclude(result => result.GameTeam)
            .Include(match => match.TeamPlayers).AsSplitQuery()
            .OrderBy(match => match.GameSession.StartsAt).ThenBy(match => match.MatchNumber).ThenBy(match => match.Id)
            .ToListAsync();
        var roster = await db.Players.AsNoTracking().Where(player => player.SportsGroupId == groupId)
            .Select(player => new { player.Id, player.Name }).ToListAsync();
        var players = roster.ToDictionary(player => player.Id,
            player => new GroupPlayerStatisticsDto(player.Id, player.Name, 0, 0, 0, 0));
        long score = 0;
        var draws = 0;
        var tiebreaks = 0;
        GroupMatchRecordDto? highest = null;
        GroupMatchRecordDto? biggest = null;
        foreach (var match in matches)
        {
            var results = match.TeamResults.OrderByDescending(result => result.Score).ThenBy(result => result.GameTeamId).ToList();
            var top = results[0].Score;
            var tied = results.Count(result => result.Score == top) > 1;
            // Explicit winners resolve tied scores; older matches infer the winner from scores.
            var winner = match.WinnerGameTeamId is Guid selected && results.Any(result => result.GameTeamId == selected)
                ? selected : !tied ? results[0].GameTeamId : (Guid?)null;
            if (winner is null) draws++;
            if (tied && winner is not null) tiebreaks++;
            var sum = results.Sum(result => (long)result.Score);
            score += sum;
            var record = new GroupMatchRecordDto(match.Name, match.GameSession.Name, match.GameSession.StartsAt,
                string.Join(" · ", results.Select(result => $"{result.GameTeam?.Name ?? "Lag"} {result.Score}")),
                sum, top - results[1].Score);
            if (highest is null || sum > highest.TotalScore) highest = record;
            if (!tied && (biggest is null || record.Margin > biggest.Margin)) biggest = record;
            foreach (var participant in match.TeamPlayers.GroupBy(player => player.PlayerId).Select(group => group.First()))
            {
                var result = results.FirstOrDefault(result => result.GameTeamId == participant.GameTeamId);
                if (result is null) continue;
                var won = winner == participant.GameTeamId;
                var drawn = winner is null && result.Score == top;
                players.TryGetValue(participant.PlayerId, out var previous);
                players[participant.PlayerId] = new(participant.PlayerId, previous?.PlayerName ?? participant.PlayerName,
                    (previous?.Matches ?? 0) + 1, (previous?.Wins ?? 0) + (won ? 1 : 0),
                    (previous?.Draws ?? 0) + (drawn ? 1 : 0), (previous?.Losses ?? 0) + (!won && !drawn ? 1 : 0));
            }
        }
        return new(sessions, matches.Select(match => match.GameSessionId).Distinct().Count(), matches.Count, score,
            draws, tiebreaks, players.Values.Count(player => player.Matches > 0), matches.Count == 0 ? 0 : Math.Round((double)score / matches.Count, 1),
            highest, biggest, players.Values.OrderByDescending(player => player.Wins).ThenByDescending(player => player.Matches)
                .ThenBy(player => player.PlayerName).ThenBy(player => player.PlayerId).ToList());
    }
}
