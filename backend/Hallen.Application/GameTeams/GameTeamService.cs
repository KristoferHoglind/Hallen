using Hallen.Application.SportsGroups;
using Hallen.Common.DTOs.GameSessionSetup;
using Hallen.Common.DTOs.GameTeams;
using Hallen.Database.Data;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.GameTeams;

public class GameTeamService : IGameTeamService
{
    private readonly HallenDbContext dbContext;

    private readonly ISportsGroupAuthorizationService authorization;

    public GameTeamService(HallenDbContext dbContext, ISportsGroupAuthorizationService authorization)
    {
        this.dbContext = dbContext;
        this.authorization = authorization;
    }

    public async Task<GameSessionTeamDto?> UpdateAsync(Guid id, UpdateGameTeamRequest request, Guid appUserId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return null;
        }

        var gameTeam = await dbContext.GameTeams
            .FirstOrDefaultAsync(x => x.Id == id);

        if (gameTeam is null || !await authorization.CanManageGameSessionAsync(gameTeam.GameSessionId, appUserId))
        {
            return null;
        }

        gameTeam.Name = request.Name.Trim();

        await dbContext.SaveChangesAsync();

        return await dbContext.GameTeams
            .AsNoTracking()
            .Where(x => x.Id == id)
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
            .FirstOrDefaultAsync();
    }
}