using Hallen.Application.SportsGroups;
using Hallen.Common.DTOs.GameMatches;
using Hallen.Database.Data;
using Hallen.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.GameMatches;

public class GameMatchService(HallenDbContext dbContext, ISportsGroupAuthorizationService sportsGroupAuthorizationService) : IGameMatchService
{
    public async Task<List<GameMatchDto>> GetByGameSessionIdAsync(Guid gameSessionId, Guid appUserId)
    {
        var hasAccess = await sportsGroupAuthorizationService.HasReadAccessToGameSessionAsync(gameSessionId, appUserId);

        if (!hasAccess)
        {
            return [];
        }

        return await dbContext.GameMatches
            .AsNoTracking()
            .Where(x => x.GameSessionId == gameSessionId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new GameMatchDto
            {
                Id = x.Id,
                Name = x.Name,
                GameSessionId = x.GameSessionId,
                MatchNumber = x.MatchNumber,
                CreatedAt = x.CreatedAt,
                FinishedAt = x.FinishedAt,
                TeamResults = x.TeamResults
                    .OrderBy(result => result.GameTeam.Name)
                    .Select(result => new GameMatchTeamResultDto
                    {
                        GameTeamId = result.GameTeamId,
                        GameTeamName = result.GameTeam.Name,
                        Score = result.Score,
                        Players = x.TeamPlayers
                            .Where(player => player.GameTeamId == result.GameTeamId)
                            .OrderBy(player => player.PlayerName)
                            .Select(player => new GameMatchTeamPlayerDto
                            {
                                PlayerId = player.PlayerId,
                                PlayerName = player.PlayerName
                            })
                            .ToList()
                    })
                    .ToList()
            })
            .ToListAsync();
    }

    public async Task<GameMatchDto?> GetByIdAsync(Guid id, Guid appUserId)
    {
        var gameSessionId = await dbContext.GameMatches
            .Where(match => match.Id == id)
            .Select(match => (Guid?)match.GameSessionId)
            .FirstOrDefaultAsync();

        if (gameSessionId is null)
        {
            return null;
        }

        var hasAccess = await sportsGroupAuthorizationService.HasReadAccessToGameSessionAsync(gameSessionId.Value, appUserId);

        if (!hasAccess)
        {
            return null;
        }

        return await dbContext.GameMatches
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new GameMatchDto
            {
                Id = x.Id,
                Name = x.Name,
                GameSessionId = x.GameSessionId,
                MatchNumber = x.MatchNumber,
                CreatedAt = x.CreatedAt,
                FinishedAt = x.FinishedAt,
                TeamResults = x.TeamResults
                    .OrderBy(result => result.GameTeam.Name)
                    .Select(result => new GameMatchTeamResultDto
                    {
                        GameTeamId = result.GameTeamId,
                        GameTeamName = result.GameTeam.Name,
                        Score = result.Score,
                        Players = x.TeamPlayers
                            .Where(player => player.GameTeamId == result.GameTeamId)
                            .OrderBy(player => player.PlayerName)
                            .Select(player => new GameMatchTeamPlayerDto
                            {
                                PlayerId = player.PlayerId,
                                PlayerName = player.PlayerName
                            })
                            .ToList()
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<GameMatchDto?> CreateAsync(Guid gameSessionId, CreateGameMatchRequest request, Guid appUserId)
    {
        var canManage = await sportsGroupAuthorizationService.CanManageGameSessionAsync(gameSessionId, appUserId);

        if (!canManage)
        {
            return null;
        }

        if (request.TeamResults.Count < 2)
        {
            return null;
        }

        var gameSessionExists = await dbContext.GameSessions
            .AnyAsync(x => x.Id == gameSessionId);

        if (!gameSessionExists)
        {
            return null;
        }

        var requestedTeamIds = request.TeamResults
            .Select(x => x.GameTeamId)
            .Distinct()
            .ToList();

        if (requestedTeamIds.Count != request.TeamResults.Count)
        {
            return null;
        }

        var validTeamIds = await dbContext.GameTeams
            .Where(x =>
                x.GameSessionId == gameSessionId &&
                requestedTeamIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync();

        if (validTeamIds.Count != requestedTeamIds.Count)
        {
            return null;
        }

        var nextMatchNumber = await GetNextMatchNumberAsync(gameSessionId);

        var gameMatch = new GameMatch
        {
            Id = Guid.NewGuid(),
            GameSessionId = gameSessionId,
            Name = string.IsNullOrWhiteSpace(request.Name)
                ? "Match"
                : request.Name.Trim(),
            MatchNumber = nextMatchNumber,
            CreatedAt = DateTimeOffset.UtcNow,
            FinishedAt = DateTimeOffset.UtcNow
        };

        var teamResults = request.TeamResults
            .Select(result => new GameMatchTeamResult
            {
                Id = Guid.NewGuid(),
                GameMatchId = gameMatch.Id,
                GameTeamId = result.GameTeamId,
                Score = result.Score
            })
            .ToList();

        var currentTeamPlayers = await dbContext.GameTeamPlayers
            .AsNoTracking()
            .Include(x => x.Player)
            .Where(x => requestedTeamIds.Contains(x.GameTeamId))
            .ToListAsync();

        var matchTeamPlayers = currentTeamPlayers
            .Select(teamPlayer => new GameMatchTeamPlayer
            {
                Id = Guid.NewGuid(),
                GameMatchId = gameMatch.Id,
                GameTeamId = teamPlayer.GameTeamId,
                PlayerId = teamPlayer.PlayerId,
                PlayerName = teamPlayer.Player.Name,
                CreatedAt = DateTimeOffset.UtcNow
            })
            .ToList();

        dbContext.GameMatches.Add(gameMatch);
        dbContext.GameMatchTeamResults.AddRange(teamResults);
        dbContext.GameMatchTeamPlayers.AddRange(matchTeamPlayers);

        await dbContext.SaveChangesAsync();

        return await GetByIdAsync(gameMatch.Id, appUserId);
    }

    public async Task<GameMatchDto?> UpdateAsync(Guid id, UpdateGameMatchRequest request, Guid appUserId)
    {
        var match = await dbContext.GameMatches.FirstOrDefaultAsync(match => match.Id == id);

        if (match is null)
        {
            return null;
        }

        var canManage = await sportsGroupAuthorizationService.CanManageGameSessionAsync(match.GameSessionId, appUserId);

        if (!canManage)
        {
            return null;
        }

        if (request.TeamResults.Count < 2)
        {
            return null;
        }

        var gameMatch = await dbContext.GameMatches
            .FirstOrDefaultAsync(x => x.Id == id);

        if (gameMatch is null)
        {
            return null;
        }

        gameMatch.Name = string.IsNullOrWhiteSpace(request.Name)
            ? "Match"
            : request.Name.Trim();

        var requestedTeamIds = request.TeamResults
            .Select(x => x.GameTeamId)
            .Distinct()
            .ToList();

        if (requestedTeamIds.Count != request.TeamResults.Count)
        {
            return null;
        }

        var validTeamIds = await dbContext.GameTeams
            .Where(x =>
                x.GameSessionId == gameMatch.GameSessionId &&
                requestedTeamIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync();

        if (validTeamIds.Count != requestedTeamIds.Count)
        {
            return null;
        }

        var existingResults = await dbContext.GameMatchTeamResults
            .Where(x => x.GameMatchId == id)
            .ToListAsync();

        dbContext.GameMatchTeamResults.RemoveRange(existingResults);

        var updatedResults = request.TeamResults
            .Select(result => new GameMatchTeamResult
            {
                Id = Guid.NewGuid(),
                GameMatchId = gameMatch.Id,
                GameTeamId = result.GameTeamId,
                Score = result.Score
            })
            .ToList();

        dbContext.GameMatchTeamResults.AddRange(updatedResults);

        gameMatch.FinishedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();

        return await GetByIdAsync(gameMatch.Id, appUserId);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid appUserId)
    {
        var match = await dbContext.GameMatches.FirstOrDefaultAsync(match => match.Id == id);

        if (match is null)
        {
            return false;
        }

        var canManage = await sportsGroupAuthorizationService.CanManageGameSessionAsync(match.GameSessionId, appUserId);

        if (!canManage)
        {
            return false;
        }

        var teamPlayers = await dbContext.GameMatchTeamPlayers
            .Where(x => x.GameMatchId == id)
            .ToListAsync();

        var results = await dbContext.GameMatchTeamResults
            .Where(x => x.GameMatchId == id)
            .ToListAsync();

        dbContext.GameMatchTeamPlayers.RemoveRange(teamPlayers);
        dbContext.GameMatchTeamResults.RemoveRange(results);
        dbContext.GameMatches.Remove(match);

        await dbContext.SaveChangesAsync();

        return true;
    }

    private async Task<int> GetNextMatchNumberAsync(Guid gameSessionId)
    {
        var latestMatchNumber = await dbContext.GameMatches
            .Where(x => x.GameSessionId == gameSessionId)
            .MaxAsync(x => (int?)x.MatchNumber);

        return (latestMatchNumber ?? 0) + 1;
    }
}