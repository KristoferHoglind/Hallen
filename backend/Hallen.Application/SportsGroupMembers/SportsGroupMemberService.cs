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
        var canManage = await sportsGroupAuthorizationService.CanManageSportsGroupAsync(sportsGroupId, appUserId);

        if (!canManage)
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
                Email = member.AppUser.Email ?? string.Empty,
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

        return await GetMemberDtoAsync(member.Id);
    }

    public async Task<SportsGroupMemberDto?> UpdateMemberRoleAsync(Guid sportsGroupId, Guid memberId, UpdateSportsGroupMemberRoleRequest request, Guid appUserId)
    {
        var currentUserRole = await sportsGroupAuthorizationService.GetRoleAsync(sportsGroupId, appUserId);

        if (currentUserRole != SportsGroupRole.Owner)
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

        var ownerCount = await dbContext.SportsGroupMembers.CountAsync(member =>
            member.SportsGroupId == sportsGroupId &&
            member.Status == SportsGroupMemberStatus.Approved &&
            member.Role == SportsGroupRole.Owner);

        if (member.Role == SportsGroupRole.Owner &&
            requestedRole.Value != SportsGroupRole.Owner &&
            ownerCount <= 1)
        {
            return null;
        }

        member.Role = requestedRole.Value;

        await dbContext.SaveChangesAsync();

        return await GetMemberDtoAsync(member.Id);
    }

    public async Task<bool> RemoveMemberAsync(Guid sportsGroupId, Guid memberId, Guid appUserId)
    {
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

        var ownerCount = await dbContext.SportsGroupMembers.CountAsync(member =>
            member.SportsGroupId == sportsGroupId &&
            member.Status == SportsGroupMemberStatus.Approved &&
            member.Role == SportsGroupRole.Owner);

        if (member.Role == SportsGroupRole.Owner && ownerCount <= 1)
        {
            return false;
        }

        dbContext.SportsGroupMembers.Remove(member);

        await dbContext.SaveChangesAsync();

        return true;
    }

    private static SportsGroupRole? ParseRole(string role)
    {
        if (Enum.TryParse<SportsGroupRole>(
                role,
                ignoreCase: true,
                out var parsedRole))
        {
            return parsedRole;
        }

        return null;
    }

    private static bool CanAddRole(SportsGroupRole currentUserRole, SportsGroupRole requestedRole)
    {
        if (currentUserRole == SportsGroupRole.Owner)
        {
            return true;
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
                Email = member.AppUser.Email ?? string.Empty,
                DisplayName = member.AppUser.DisplayName,
                Role = member.Role.ToString(),
                Status = member.Status.ToString(),
                CreatedAt = member.CreatedAt,
                ApprovedAt = member.ApprovedAt,
            })
            .FirstOrDefaultAsync();
    }
}