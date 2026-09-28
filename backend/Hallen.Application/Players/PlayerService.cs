using Hallen.Application.SportsGroups;
using Hallen.Common.DTOs.Players;
using Hallen.Database.Data;
using Hallen.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.Players;

public class PlayerService(HallenDbContext dbContext, ISportsGroupAuthorizationService sportsGroupAuthorizationService) : IPlayerService
{
    public async Task<List<PlayerDto>> GetPlayersBySportsGroupAsync(Guid sportsGroupId, Guid appUserId)
    {
        var hasAccess = await sportsGroupAuthorizationService
            .HasApprovedMembershipAsync(sportsGroupId, appUserId);

        if (!hasAccess)
        {
            return [];
        }

        return await dbContext.Players
            .Where(player => player.SportsGroupId == sportsGroupId)
            .OrderBy(player => player.Name)
            .Select(player => new PlayerDto
            {
                Id = player.Id,
                Name = player.Name,
                IsActive = player.IsActive,
                CreatedAt = player.CreatedAt,
                SportsGroupId = player.SportsGroupId,
            })
            .ToListAsync();
    }

    public async Task<PlayerDto?> GetPlayerAsync(Guid id, Guid appUserId)
    {
        var player = await dbContext.Players
            .Where(player => player.Id == id)
            .Select(player => new
            {
                player.Id,
                player.Name,
                player.IsActive,
                player.CreatedAt,
                player.SportsGroupId,
            })
            .FirstOrDefaultAsync();

        if (player is null)
        {
            return null;
        }

        var hasAccess = await sportsGroupAuthorizationService
            .HasApprovedMembershipAsync(player.SportsGroupId, appUserId);

        if (!hasAccess)
        {
            return null;
        }

        return new PlayerDto
        {
            Id = player.Id,
            Name = player.Name,
            IsActive = player.IsActive,
            CreatedAt = player.CreatedAt,
            SportsGroupId = player.SportsGroupId,
        };
    }

    public async Task<PlayerDto> CreatePlayerAsync(CreatePlayerRequest request)
    {
        throw new NotSupportedException(
            "Use CreatePlayerForSportsGroupAsync when creating players.");
    }

    public async Task<PlayerDto?> CreatePlayerForSportsGroupAsync(Guid sportsGroupId, CreatePlayerRequest request, Guid appUserId)
    {
        var canManage = await sportsGroupAuthorizationService
            .CanManageSportsGroupAsync(sportsGroupId, appUserId);

        if (!canManage)
        {
            return null;
        }

        var trimmedName = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(trimmedName))
        {
            return null;
        }

        var player = new Player
        {
            Id = Guid.NewGuid(),
            SportsGroupId = sportsGroupId,
            Name = trimmedName,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.Players.Add(player);

        await dbContext.SaveChangesAsync();

        return new PlayerDto
        {
            Id = player.Id,
            Name = player.Name,
            IsActive = player.IsActive,
            CreatedAt = player.CreatedAt,
            SportsGroupId = player.SportsGroupId,
        };
    }

    public async Task<bool> UpdatePlayerAsync(Guid id, UpdatePlayerRequest request, Guid appUserId)
    {
        var player = await dbContext.Players.FindAsync(id);

        if (player is null)
        {
            return false;
        }

        var canManage = await sportsGroupAuthorizationService
            .CanManageSportsGroupAsync(player.SportsGroupId, appUserId);

        if (!canManage)
        {
            return false;
        }

        var trimmedName = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(trimmedName))
        {
            return false;
        }

        player.Name = trimmedName;
        player.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeletePlayerAsync(Guid id, Guid appUserId)
    {
        var player = await dbContext.Players.FindAsync(id);

        if (player is null)
        {
            return false;
        }

        var canManage = await sportsGroupAuthorizationService
            .CanManageSportsGroupAsync(player.SportsGroupId, appUserId);

        if (!canManage)
        {
            return false;
        }

        dbContext.Players.Remove(player);

        await dbContext.SaveChangesAsync();

        return true;
    }
}