using Hallen.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Database.Data;

public static class DatabaseSeeder
{
    public static async Task SeedDevelopmentDataAsync(HallenDbContext dbContext)
    {
        if (await dbContext.SportsGroups.AnyAsync())
        {
            return;
        }

        var sportsGroup = new SportsGroup
        {
            Id = Guid.NewGuid(),
            Name = "Söndagsinnebandy",
            CreatedAt = DateTimeOffset.UtcNow
        };

        var players = new List<Player>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Kristofer",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                SportsGroup = sportsGroup
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Anna",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                SportsGroup = sportsGroup
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Johan",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                SportsGroup = sportsGroup
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Sara",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                SportsGroup = sportsGroup
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Mikael",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                SportsGroup = sportsGroup
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Emma",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                SportsGroup = sportsGroup
            }
        };

        var gameSession = new GameSession
        {
            Id = Guid.NewGuid(),
            Name = "Söndagsmatchen",
            StartsAt = DateTimeOffset.UtcNow.AddDays(3),
            CreatedAt = DateTimeOffset.UtcNow,
            SportsGroup = sportsGroup
        };

        var redTeam = new GameTeam
        {
            Id = Guid.NewGuid(),
            Name = "Röda laget",
            CreatedAt = DateTimeOffset.UtcNow,
            GameSession = gameSession
        };

        var blueTeam = new GameTeam
        {
            Id = Guid.NewGuid(),
            Name = "Blå laget",
            CreatedAt = DateTimeOffset.UtcNow,
            GameSession = gameSession
        };

        var teamPlayers = new List<GameTeamPlayer>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Player = players[0],
                GameTeam = redTeam,
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Player = players[1],
                GameTeam = redTeam,
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Player = players[2],
                GameTeam = redTeam,
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Player = players[3],
                GameTeam = blueTeam,
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Player = players[4],
                GameTeam = blueTeam,
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Player = players[5],
                GameTeam = blueTeam,
                CreatedAt = DateTimeOffset.UtcNow
            }
        };

        var gameMatch = new GameMatch
        {
            Id = Guid.NewGuid(),
            MatchNumber = 1,
            CreatedAt = DateTimeOffset.UtcNow,
            FinishedAt = DateTimeOffset.UtcNow.AddMinutes(12),
            GameSession = gameSession
        };

        var matchResults = new List<GameMatchTeamResult>
        {
            new()
            {
                Id = Guid.NewGuid(),
                GameMatch = gameMatch,
                GameTeam = redTeam,
                Score = 5
            },
            new()
            {
                Id = Guid.NewGuid(),
                GameMatch = gameMatch,
                GameTeam = blueTeam,
                Score = 3
            }
        };

        dbContext.SportsGroups.Add(sportsGroup);
        dbContext.Players.AddRange(players);
        dbContext.GameSessions.Add(gameSession);
        dbContext.GameTeams.AddRange(redTeam, blueTeam);
        dbContext.GameTeamPlayers.AddRange(teamPlayers);
        dbContext.GameMatches.Add(gameMatch);
        dbContext.GameMatchTeamResults.AddRange(matchResults);

        await dbContext.SaveChangesAsync();
    }
}