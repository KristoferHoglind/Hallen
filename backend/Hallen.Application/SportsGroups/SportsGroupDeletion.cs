using Hallen.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.SportsGroups;

public static class SportsGroupDeletion
{
    // Call inside a transaction after locking the group and checking authorization.
    public static async Task DeleteContentsAsync(HallenDbContext db, Guid groupId)
    {
        // Prevent new matches/teams from appearing while deleting the session contents.
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM game_sessions WHERE sports_group_id = {groupId} ORDER BY id FOR UPDATE");
        // Matches reference teams/players with RESTRICT, so remove them before sessions
        // (which cascade teams and attendance), then remove the players.
        await db.GameMatches.Where(match => match.GameSession.SportsGroupId == groupId).ExecuteDeleteAsync();
        await db.GameSessions.Where(session => session.SportsGroupId == groupId).ExecuteDeleteAsync();
        await db.Players.Where(player => player.SportsGroupId == groupId).ExecuteDeleteAsync();
    }
}
