using Hallen.Common.DTOs.SportsGroupMembers;

namespace Hallen.Application.SportsGroupMembers;

public interface ISportsGroupMemberService
{
    Task<List<SportsGroupMemberDto>> GetMembersAsync(Guid sportsGroupId, Guid appUserId);

    Task<SportsGroupMemberDto?> AddMemberAsync(Guid sportsGroupId, AddSportsGroupMemberRequest request, Guid appUserId);

    Task<SportsGroupMemberDto?> UpdateMemberRoleAsync(Guid sportsGroupId, Guid memberId, UpdateSportsGroupMemberRoleRequest request, Guid appUserId);

    Task<bool> RemoveMemberAsync(Guid sportsGroupId, Guid memberId, Guid appUserId);
}