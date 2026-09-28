using Hallen.Application.SportsGroups;
using Hallen.Common.DTOs.GameSessions;
using Hallen.Database.Data;
using Hallen.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.GameSessions;

public class GameSessionService(HallenDbContext dbContext, ISportsGroupAuthorizationService sportsGroupAuthorizationService) : IGameSessionService
{

    public async Task<List<GameSessionDto>> GetGameSessionsForSportsGroupAsync(Guid sportsGroupId, Guid appUserId)
    {
        var hasAccess = await sportsGroupAuthorizationService
            .HasApprovedMembershipAsync(sportsGroupId, appUserId);

        if (!hasAccess)
        {
            return [];
        }

        return await dbContext.GameSessions
            .Where(gameSession => gameSession.SportsGroupId == sportsGroupId)
            .OrderByDescending(gameSession => gameSession.StartsAt)
            .Select(gameSession => new GameSessionDto
            {
                Id = gameSession.Id,
                Name = gameSession.Name,
                StartsAt = gameSession.StartsAt,
                CreatedAt = gameSession.CreatedAt,
                SportsGroupId = gameSession.SportsGroupId,
                NumberOfTeams = gameSession.NumberOfTeams,
                ParticipantCount = gameSession.GameSessionPlayers.Count,
            })
            .ToListAsync();
    }

    public async Task<GameSessionDto?> GetGameSessionAsync(Guid id, Guid appUserId)
    {
        var gameSession = await dbContext.GameSessions
            .Where(gameSession => gameSession.Id == id)
            .Select(gameSession => new
            {
                gameSession.Id,
                gameSession.Name,
                gameSession.StartsAt,
                gameSession.CreatedAt,
                gameSession.SportsGroupId,
                gameSession.NumberOfTeams,
                ParticipantCount = gameSession.GameSessionPlayers.Count,
            })
            .FirstOrDefaultAsync();

        if (gameSession is null)
        {
            return null;
        }

        var hasAccess = await sportsGroupAuthorizationService
            .HasApprovedMembershipAsync(gameSession.SportsGroupId, appUserId);

        if (!hasAccess)
        {
            return null;
        }

        return new GameSessionDto
        {
            Id = gameSession.Id,
            Name = gameSession.Name,
            StartsAt = gameSession.StartsAt,
            CreatedAt = gameSession.CreatedAt,
            SportsGroupId = gameSession.SportsGroupId,
            NumberOfTeams = gameSession.NumberOfTeams,
            ParticipantCount = gameSession.ParticipantCount,
        };
    }

    public async Task<GameSessionDto?> CreateGameSessionForSportsGroupAsync(Guid sportsGroupId, CreateGameSessionRequest request, Guid appUserId)
    {
        var canManage = await sportsGroupAuthorizationService
            .CanManageSportsGroupAsync(sportsGroupId, appUserId);

        if (!canManage)
        {
            return null;
        }

        if (
            string.IsNullOrWhiteSpace(request.Name) ||
            request.NumberOfTeams < 2 ||
            request.PlayerIds.Count == 0)
        {
            return null;
        }

        var selectedPlayerIds = request.PlayerIds
            .Distinct()
            .ToList();

        var validPlayers = await dbContext.Players
            .Where(player =>
                player.SportsGroupId == sportsGroupId &&
                request.PlayerIds.Contains(player.Id) &&
                player.IsActive)
            .ToListAsync();

        if (validPlayers.Count != selectedPlayerIds.Count)
        {
            return null;
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync();

        var gameSession = new GameSession
        {
            Id = Guid.NewGuid(),
            SportsGroupId = sportsGroupId,
            Name = request.Name.Trim(),
            StartsAt = request.StartsAt,
            NumberOfTeams = request.NumberOfTeams,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.GameSessions.Add(gameSession);

        var sessionPlayers = validPlayers
            .Select(player => new GameSessionPlayer
            {
                Id = Guid.NewGuid(),
                GameSessionId = gameSession.Id,
                PlayerId = player.Id,
                CreatedAt = DateTimeOffset.UtcNow
            })
            .ToList();

        dbContext.GameSessionPlayers.AddRange(sessionPlayers);

        var teams = Enumerable.Range(1, request.NumberOfTeams)
            .Select(index => new GameTeam
            {
                Id = Guid.NewGuid(),
                GameSessionId = gameSession.Id,
                Name = $"Lag {index}",
                CreatedAt = DateTimeOffset.UtcNow
            })
            .ToList();

        dbContext.GameTeams.AddRange(teams);

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return await GetGameSessionAsync(gameSession.Id, appUserId);
    }

    public async Task<bool> UpdateGameSessionAsync(Guid id, UpdateGameSessionRequest request, Guid appUserId)
    {
        var gameSession = await dbContext.GameSessions.FindAsync(id);

        if (gameSession is null)
        {
            return false;
        }

        var canManage = await sportsGroupAuthorizationService
            .CanManageSportsGroupAsync(gameSession.SportsGroupId, appUserId);

        if (!canManage)
        {
            return false;
        }

        var trimmedName = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(trimmedName))
        {
            return false;
        }

        gameSession.Name = trimmedName;
        gameSession.StartsAt = request.StartsAt;

        await dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteGameSessionAsync(Guid id, Guid appUserId)
    {
        var gameSession = await dbContext.GameSessions.FindAsync(id);

        if (gameSession is null)
        {
            return false;
        }

        var canManage = await sportsGroupAuthorizationService
            .CanManageSportsGroupAsync(gameSession.SportsGroupId, appUserId);

        if (!canManage)
        {
            return false;
        }

        dbContext.GameSessions.Remove(gameSession);

        await dbContext.SaveChangesAsync();

        return true;
    }
}