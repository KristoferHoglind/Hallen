using Hallen.Application.SportsGroups;
using Hallen.Common.DTOs.GameSessionSetup;
using Hallen.Database.Data;
using Hallen.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.GameSessionSetup;

public class GameSessionSetupService(HallenDbContext dbContext, ISportsGroupAuthorizationService sportsGroupAuthorizationService) : IGameSessionSetupService
{
    public async Task<GameSessionSetupDto?> GetSetupAsync(Guid gameSessionId, Guid appUserId)
    {
        var hasAccess = await sportsGroupAuthorizationService.HasReadAccessToGameSessionAsync(gameSessionId, appUserId);

        if (!hasAccess)
        {
            return null;
        }

        var gameSession = await dbContext.GameSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == gameSessionId);

        if (gameSession is null)
        {
            return null;
        }

        return await BuildSetupDtoAsync(gameSessionId);
    }

    public async Task<GameSessionSetupDto?> RandomizeTeamsAsync(Guid gameSessionId, Guid appUserId)
    {
        var canManage = await sportsGroupAuthorizationService.CanManageGameSessionAsync(gameSessionId, appUserId);

        if (!canManage)
        {
            return null;
        }

        var gameSession = await dbContext.GameSessions
            .FirstOrDefaultAsync(x => x.Id == gameSessionId);

        if (gameSession is null || gameSession.NumberOfTeams < 2)
        {
            return null;
        }

        var sessionPlayers = await dbContext.GameSessionPlayers
            .Include(x => x.Player)
            .Where(x => x.GameSessionId == gameSessionId)
            .ToListAsync();

        if (sessionPlayers.Count == 0)
        {
            return null;
        }

        var teams = await dbContext.GameTeams
            .Where(x => x.GameSessionId == gameSessionId)
            .OrderBy(x => x.Name)
            .Take(gameSession.NumberOfTeams)
            .ToListAsync();

        if (teams.Count != gameSession.NumberOfTeams)
        {
            return null;
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync();

        var existingTeamPlayers = await dbContext.GameTeamPlayers
            .Include(x => x.GameTeam)
            .Where(x => x.GameTeam.GameSessionId == gameSessionId)
            .ToListAsync();

        dbContext.GameTeamPlayers.RemoveRange(existingTeamPlayers);

        var shuffledPlayers = sessionPlayers
            .OrderBy(_ => Guid.NewGuid())
            .ToList();

        var gameTeamPlayers = new List<GameTeamPlayer>();

        for (var i = 0; i < shuffledPlayers.Count; i++)
        {
            var team = teams[i % teams.Count];
            var sessionPlayer = shuffledPlayers[i];

            gameTeamPlayers.Add(new GameTeamPlayer
            {
                Id = Guid.NewGuid(),
                GameTeamId = team.Id,
                PlayerId = sessionPlayer.PlayerId,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        dbContext.GameTeamPlayers.AddRange(gameTeamPlayers);

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return await BuildSetupDtoAsync(gameSessionId);
    }

    public async Task<GameSessionSetupDto?> CreateEmptyTeamsAsync(Guid gameSessionId, CreateEmptyTeamsRequest request, Guid appUserId)
    {
        var canManage = await sportsGroupAuthorizationService.CanManageGameSessionAsync(gameSessionId, appUserId);

        if (!canManage)
        {
            return null;
        }

        if (request.NumberOfTeams < 2 || request.PlayerIds.Count == 0)
        {
            return null;
        }

        var gameSession = await dbContext.GameSessions
            .FirstOrDefaultAsync(x => x.Id == gameSessionId);

        if (gameSession is null)
        {
            return null;
        }

        var selectedPlayerIds = request.PlayerIds.Distinct().ToList();

        var validPlayers = await dbContext.Players
            .Where(x =>
                selectedPlayerIds.Contains(x.Id) &&
                x.SportsGroupId == gameSession.SportsGroupId &&
                x.IsActive)
            .ToListAsync();

        if (validPlayers.Count != selectedPlayerIds.Count)
        {
            return null;
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync();

        await ClearCurrentTeamSetupAsync(gameSessionId);

        var gameSessionPlayers = validPlayers
            .Select(player => new GameSessionPlayer
            {
                Id = Guid.NewGuid(),
                GameSessionId = gameSessionId,
                PlayerId = player.Id,
                CreatedAt = DateTimeOffset.UtcNow
            })
            .ToList();

        dbContext.GameSessionPlayers.AddRange(gameSessionPlayers);

        await GetOrCreateTeamsAsync(gameSessionId, request.NumberOfTeams);

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return await BuildSetupDtoAsync(gameSessionId);
    }

    public async Task<GameSessionSetupDto?> MovePlayerToTeamAsync(Guid gameSessionId, Guid playerId, MovePlayerToTeamRequest request, Guid appUserId)
    {
        var canManage = await sportsGroupAuthorizationService.CanManageGameSessionAsync(gameSessionId, appUserId);

        if (!canManage)
        {
            return null;
        }

        var participantExists = await dbContext.GameSessionPlayers
            .AnyAsync(x =>
                x.GameSessionId == gameSessionId &&
                x.PlayerId == playerId);

        if (!participantExists)
        {
            return null;
        }

        if (request.GameTeamId is not null)
        {
            var teamExists = await dbContext.GameTeams
                .AnyAsync(x =>
                    x.Id == request.GameTeamId.Value &&
                    x.GameSessionId == gameSessionId);

            if (!teamExists)
            {
                return null;
            }
        }

        var existingTeamPlayers = await dbContext.GameTeamPlayers
            .Include(x => x.GameTeam)
            .Where(x =>
                x.PlayerId == playerId &&
                x.GameTeam.GameSessionId == gameSessionId)
            .ToListAsync();

        dbContext.GameTeamPlayers.RemoveRange(existingTeamPlayers);

        if (request.GameTeamId is not null)
        {
            dbContext.GameTeamPlayers.Add(new GameTeamPlayer
            {
                Id = Guid.NewGuid(),
                GameTeamId = request.GameTeamId.Value,
                PlayerId = playerId,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        await dbContext.SaveChangesAsync();

        return await BuildSetupDtoAsync(gameSessionId);
    }

    private async Task ClearCurrentTeamSetupAsync(Guid gameSessionId)
    {
        var existingTeamPlayers = await dbContext.GameTeamPlayers
            .Include(x => x.GameTeam)
            .Where(x => x.GameTeam.GameSessionId == gameSessionId)
            .ToListAsync();

        dbContext.GameTeamPlayers.RemoveRange(existingTeamPlayers);

        var existingSessionPlayers = await dbContext.GameSessionPlayers
            .Where(x => x.GameSessionId == gameSessionId)
            .ToListAsync();

        dbContext.GameSessionPlayers.RemoveRange(existingSessionPlayers);
    }

    private async Task<GameSessionSetupDto?> BuildSetupDtoAsync(Guid gameSessionId)
    {
        var gameSession = await dbContext.GameSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == gameSessionId);

        if (gameSession is null)
        {
            return null;
        }

        var participants = await dbContext.GameSessionPlayers
            .AsNoTracking()
            .Where(x => x.GameSessionId == gameSessionId)
            .Include(x => x.Player)
            .OrderBy(x => x.Player.Name)
            .Select(x => new GameSessionParticipantDto
            {
                PlayerId = x.PlayerId,
                PlayerName = x.Player.Name,
                IsAssignedToTeam = false,
                GameTeamId = null
            })
            .ToListAsync();

        var teams = await dbContext.GameTeams
            .AsNoTracking()
            .Where(x => x.GameSessionId == gameSessionId)
            .OrderBy(x => x.Name)
            .Select(x => new GameSessionTeamDto
            {
                Id = x.Id,
                Name = x.Name,
                Players = x.GameTeamPlayers
                    .OrderBy(gtp => gtp.Player.Name)
                    .Select(gtp => new GameSessionParticipantDto
                    {
                        PlayerId = gtp.PlayerId,
                        PlayerName = gtp.Player.Name,
                        IsAssignedToTeam = true,
                        GameTeamId = x.Id
                    })
                    .ToList()
            })
            .ToListAsync();

        var assignedPlayerIds = teams
            .SelectMany(x => x.Players)
            .Select(x => x.PlayerId)
            .ToHashSet();

        foreach (var participant in participants)
        {
            if (assignedPlayerIds.Contains(participant.PlayerId))
            {
                var assignedTeam = teams.FirstOrDefault(team =>
                    team.Players.Any(player => player.PlayerId == participant.PlayerId));

                participant.IsAssignedToTeam = true;
                participant.GameTeamId = assignedTeam?.Id;
            }
        }

        return new GameSessionSetupDto
        {
            GameSessionId = gameSession.Id,
            GameSessionName = gameSession.Name,
            StartsAt = gameSession.StartsAt,
            SportsGroupId = gameSession.SportsGroupId,
            Participants = participants,
            Teams = teams
        };
    }

    private async Task<List<GameTeam>> GetOrCreateTeamsAsync(Guid gameSessionId, int numberOfTeams)
    {
        var existingTeams = await dbContext.GameTeams
            .Where(x => x.GameSessionId == gameSessionId)
            .OrderBy(x => x.Name)
            .ToListAsync();

        if (existingTeams.Count < numberOfTeams)
        {
            var teamsToCreate = Enumerable
                .Range(existingTeams.Count + 1, numberOfTeams - existingTeams.Count)
                .Select(index => new GameTeam
                {
                    Id = Guid.NewGuid(),
                    GameSessionId = gameSessionId,
                    Name = $"Lag {index}",
                    CreatedAt = DateTimeOffset.UtcNow
                })
                .ToList();

            dbContext.GameTeams.AddRange(teamsToCreate);
            existingTeams.AddRange(teamsToCreate);
        }

        return existingTeams
            .OrderBy(x => x.Name)
            .Take(numberOfTeams)
            .ToList();
    }
}