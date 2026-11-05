using Hallen.Common.DTOs.SportsGroups;
using Hallen.Database.Data;
using Hallen.Database.Entities;
using Hallen.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.SportsGroups;

public class SportsGroupService(HallenDbContext dbContext, ISportsGroupAuthorizationService authorizationService) : ISportsGroupService
{
    public const int GroupCreationLimit = 20;

    public async Task<GroupCreationQuotaDto> GetCreationQuotaAsync(Guid appUserId)
    {
        var user = await dbContext.Users.SingleAsync(user => user.Id == appUserId);
        var count = await dbContext.SportsGroups.CountAsync(group => group.CreatedByUserId == appUserId);
        int? limit = user.IsSysAdmin ? null : GroupCreationLimit;
        return new GroupCreationQuotaDto(count, limit,
            user.Status == UserAccountStatus.Active && user.CanCreateGroups &&
            (!limit.HasValue || count < limit.Value));
    }

    public async Task<List<SportsGroupDto>> GetSportsGroupsAsync(Guid appUserId)
    {
        return await dbContext.SportsGroupMembers
            .Where(member =>
                member.AppUserId == appUserId &&
                member.Status == SportsGroupMemberStatus.Approved)
            .OrderBy(member => member.SportsGroup.Name)
            .Select(member => new SportsGroupDto
            {
                Id = member.SportsGroup.Id,
                Name = member.SportsGroup.Name,
                Description = member.SportsGroup.Description,
                CreatedAt = member.SportsGroup.CreatedAt,
                CurrentUserRole = member.Role.ToString(),
                CanManage =
                    member.Role == SportsGroupRole.Owner ||
                    member.Role == SportsGroupRole.Admin,
                IsOwner = member.Role == SportsGroupRole.Owner,
                IsCreatedByCurrentUser = member.SportsGroup.CreatedByUserId == appUserId,
            })
            .ToListAsync();
    }

    public async Task<SportsGroupDto?> GetSportsGroupAsync(Guid id, Guid appUserId)
    {
        return await dbContext.SportsGroupMembers
            .Where(member =>
                member.SportsGroupId == id &&
                member.AppUserId == appUserId &&
                member.Status == SportsGroupMemberStatus.Approved)
            .Select(member => new SportsGroupDto
            {
                Id = member.SportsGroup.Id,
                Name = member.SportsGroup.Name,
                Description = member.SportsGroup.Description,
                CreatedAt = member.SportsGroup.CreatedAt,
                CurrentUserRole = member.Role.ToString(),
                CanManage =
                    member.Role == SportsGroupRole.Owner ||
                    member.Role == SportsGroupRole.Admin,
                IsOwner = member.Role == SportsGroupRole.Owner,
                IsCreatedByCurrentUser = member.SportsGroup.CreatedByUserId == appUserId,
            })
            .FirstOrDefaultAsync();
    }

    public async Task<SportsGroupDto> CreateSportsGroupAsync(CreateSportsGroupRequest request, Guid appUserId)
    {
        var trimmedName = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(trimmedName))
        {
            throw new ArgumentException("Sports group name is required.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync();
        // Serialize creation per account so concurrent requests cannot exceed the quota.
        await dbContext.Database.ExecuteSqlInterpolatedAsync($"SELECT \"Id\" FROM \"AspNetUsers\" WHERE \"Id\" = {appUserId} FOR UPDATE");
        var quota = await GetCreationQuotaAsync(appUserId);
        if (!quota.CanCreate)
            throw new GroupCreationDeniedException();

        var createdAt = DateTimeOffset.UtcNow;

        var sportsGroup = new SportsGroup
        {
            Id = Guid.NewGuid(),
            Name = trimmedName,
            CreatedByUserId = appUserId,
            CreatedAt = createdAt,
        };

        var ownerMembership = new SportsGroupMember
        {
            Id = Guid.NewGuid(),
            SportsGroupId = sportsGroup.Id,
            AppUserId = appUserId,
            Role = SportsGroupRole.Owner,
            Status = SportsGroupMemberStatus.Approved,
            CreatedAt = createdAt,
            ApprovedAt = createdAt,
            ApprovedByUserId = appUserId,
        };

        dbContext.SportsGroups.Add(sportsGroup);
        dbContext.SportsGroupMembers.Add(ownerMembership);

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return new SportsGroupDto
        {
            Id = sportsGroup.Id,
            Name = sportsGroup.Name,
            CreatedAt = sportsGroup.CreatedAt,
            CurrentUserRole = SportsGroupRole.Owner.ToString(),
            CanManage = true,
            IsOwner = true,
            IsCreatedByCurrentUser = true,
        };
    }

    public async Task<bool> UpdateSportsGroupAsync(Guid id, UpdateSportsGroupRequest request, Guid appUserId)
    {
        var canManage = await authorizationService.CanManageSportsGroupAsync(id, appUserId);

        if (!canManage)
        {
            return false;
        }

        var sportsGroup = await dbContext.SportsGroups.FindAsync(id);

        if (sportsGroup is null)
        {
            return false;
        }

        var trimmedName = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(trimmedName))
        {
            return false;
        }

        sportsGroup.Name = trimmedName;

        await dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteSportsGroupAsync(Guid id, Guid appUserId)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync();
        // Serialize deletion with ownership transfers, then check the current owner.
        await dbContext.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM sports_groups WHERE id = {id} FOR UPDATE");
        dbContext.ChangeTracker.Clear();
        var isOwner = await authorizationService.IsOwnerAsync(id, appUserId);

        if (!isOwner)
        {
            return false;
        }

        var sportsGroup = await dbContext.SportsGroups.FindAsync(id);

        if (sportsGroup is null)
        {
            return false;
        }

        await SportsGroupDeletion.DeleteContentsAsync(dbContext, id);
        dbContext.SportsGroups.Remove(sportsGroup);

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return true;
    }
}