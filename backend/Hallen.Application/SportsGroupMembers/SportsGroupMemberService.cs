using Hallen.Application.SportsGroups;
using Hallen.Common.DTOs.SportsGroupMembers;
using Hallen.Database.Data;
using Hallen.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Application.SportsGroupMembers;

public class SportsGroupMemberService(HallenDbContext dbContext, ISportsGroupAuthorizationService sportsGroupAuthorizationService) : ISportsGroupMemberService
{
    public async Task<List<SportsGroupMemberDto>> GetMembersAsync(Guid sportsGroupId, Guid appUserId)
    {
        var hasAccess = await sportsGroupAuthorizationService.HasApprovedMembershipAsync(sportsGroupId, appUserId);

        if (!hasAccess)
        {
            return [];
        }

        return await dbContext.SportsGroupMembers
            .Where(member => member.SportsGroupId == sportsGroupId)
            .OrderBy(member => member.AppUser.DisplayName)
            .Select(member => new SportsGroupMemberDto
            {
                Id = member.Id,
                SportsGroupId = member.SportsGroupId,
                AppUserId = member.AppUserId,
                DisplayName = member.AppUser.DisplayName,
                Role = member.Role.ToString(),
                Status = member.Status.ToString(),
                CreatedAt = member.CreatedAt,
                ApprovedAt = member.ApprovedAt,
            })
            .ToListAsync();
    }

    public async Task<SportsGroupMemberDto?> AddMemberAsync(Guid sportsGroupId, AddSportsGroupMemberRequest request, Guid appUserId)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync();
        await LockGroupAsync(sportsGroupId);

        var requestedRole = ParseRole(request.Role);

        if (requestedRole is null)
        {
            return null;
        }

        var currentUserRole = await sportsGroupAuthorizationService.GetRoleAsync(sportsGroupId, appUserId);

        if (currentUserRole is null)
        {
            return null;
        }

        if (!CanAddRole(currentUserRole.Value, requestedRole.Value))
        {
            return null;
        }

        var email = request.Email.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var userToAdd = await dbContext.Users
            .FirstOrDefaultAsync(user => user.NormalizedEmail == email);

        if (userToAdd is null)
        {
            return null;
        }

        var existingMember = await dbContext.SportsGroupMembers
            .FirstOrDefaultAsync(member =>
                member.SportsGroupId == sportsGroupId &&
                member.AppUserId == userToAdd.Id);

        if (existingMember is not null)
        {
            if (existingMember.Status == SportsGroupMemberStatus.Approved)
            {
                return await GetMemberDtoAsync(existingMember.Id);
            }

            existingMember.Role = requestedRole.Value;
            existingMember.Status = SportsGroupMemberStatus.Approved;
            existingMember.ApprovedAt = DateTimeOffset.UtcNow;
            existingMember.ApprovedByUserId = appUserId;

            await dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return await GetMemberDtoAsync(existingMember.Id);
        }

        var member = new SportsGroupMember
        {
            Id = Guid.NewGuid(),
            SportsGroupId = sportsGroupId,
            AppUserId = userToAdd.Id,
            Role = requestedRole.Value,
            Status = SportsGroupMemberStatus.Approved,
            CreatedAt = DateTimeOffset.UtcNow,
            ApprovedAt = DateTimeOffset.UtcNow,
            ApprovedByUserId = appUserId,
        };

        dbContext.SportsGroupMembers.Add(member);

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return await GetMemberDtoAsync(member.Id);
    }

    public async Task<SportsGroupMemberDto?> UpdateMemberRoleAsync(Guid sportsGroupId, Guid memberId, UpdateSportsGroupMemberRoleRequest request, Guid appUserId)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync();
        await LockGroupAsync(sportsGroupId);

        var currentUserRole = await sportsGroupAuthorizationService.GetRoleAsync(sportsGroupId, appUserId);

        if (currentUserRole is not (SportsGroupRole.Owner or SportsGroupRole.Admin))
        {
            return null;
        }

        var requestedRole = ParseRole(request.Role);

        if (requestedRole is null)
        {
            return null;
        }

        var member = await dbContext.SportsGroupMembers
            .FirstOrDefaultAsync(member =>
                member.Id == memberId &&
                member.SportsGroupId == sportsGroupId);

        if (member is null)
        {
            return null;
        }

        if (member.Role == SportsGroupRole.Owner || requestedRole == SportsGroupRole.Owner ||
            member.Status != SportsGroupMemberStatus.Approved) return null;

        member.Role = requestedRole.Value;

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return await GetMemberDtoAsync(member.Id);
    }

    public async Task<bool> RemoveMemberAsync(Guid sportsGroupId, Guid memberId, Guid appUserId)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync();
        await LockGroupAsync(sportsGroupId);

        var currentUserRole = await sportsGroupAuthorizationService.GetRoleAsync(sportsGroupId, appUserId);

        if (currentUserRole != SportsGroupRole.Owner)
        {
            return false;
        }

        var member = await dbContext.SportsGroupMembers
            .FirstOrDefaultAsync(member =>
                member.Id == memberId &&
                member.SportsGroupId == sportsGroupId);

        if (member is null)
        {
            return false;
        }

        if (member.Role == SportsGroupRole.Owner) return false;

        dbContext.SportsGroupMembers.Remove(member);

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return true;
    }

    private async Task LockGroupAsync(Guid groupId)
    {
        await dbContext.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM sports_groups WHERE id = {groupId} FOR UPDATE");
        dbContext.ChangeTracker.Clear();
    }

    public async Task<bool> TransferOwnershipAsync(Guid sportsGroupId, Guid memberId, Guid appUserId)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync();
        await LockGroupAsync(sportsGroupId);
        var owner = await dbContext.SportsGroupMembers.SingleOrDefaultAsync(member =>
            member.SportsGroupId == sportsGroupId && member.AppUserId == appUserId &&
            member.Role == SportsGroupRole.Owner && member.Status == SportsGroupMemberStatus.Approved && member.AppUser.Status == UserAccountStatus.Active);
        var target = await dbContext.SportsGroupMembers.SingleOrDefaultAsync(member =>
            member.Id == memberId && member.SportsGroupId == sportsGroupId &&
            member.Status == SportsGroupMemberStatus.Approved && member.AppUser.Status == UserAccountStatus.Active);
        if (owner is null || target is null || target.AppUserId == appUserId) return false;
        // Release the unique owner slot before assigning it, inside the same transaction.
        owner.Role = SportsGroupRole.Admin;
        await dbContext.SaveChangesAsync();
        target.Role = SportsGroupRole.Owner;
        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
        return true;
    }

    private static SportsGroupRole? ParseRole(string role)
    {
        if (Enum.TryParse<SportsGroupRole>(
                role,
                ignoreCase: true,
                out var parsedRole))
        {
            return Enum.IsDefined(parsedRole) ? parsedRole : null;
        }

        return null;
    }

    private static bool CanAddRole(SportsGroupRole currentUserRole, SportsGroupRole requestedRole)
    {
        if (currentUserRole == SportsGroupRole.Owner)
        {
            return requestedRole is SportsGroupRole.Member or SportsGroupRole.Admin;
        }

        if (currentUserRole == SportsGroupRole.Admin)
        {
            return requestedRole == SportsGroupRole.Member;
        }

        return false;
    }

    private async Task<SportsGroupMemberDto?> GetMemberDtoAsync(Guid memberId)
    {
        return await dbContext.SportsGroupMembers
            .Where(member => member.Id == memberId)
            .Select(member => new SportsGroupMemberDto
            {
                Id = member.Id,
                SportsGroupId = member.SportsGroupId,
                AppUserId = member.AppUserId,
                DisplayName = member.AppUser.DisplayName,
                Role = member.Role.ToString(),
                Status = member.Status.ToString(),
                CreatedAt = member.CreatedAt,
                ApprovedAt = member.ApprovedAt,
            })
            .FirstOrDefaultAsync();
    }
}