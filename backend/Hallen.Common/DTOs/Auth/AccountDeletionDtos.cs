using System.ComponentModel.DataAnnotations;

namespace Hallen.Common.DTOs.Auth;

public record OwnershipCandidateDto(Guid MemberId, Guid UserId, string DisplayName, string Email, string Role);
public record OwnedGroupDeletionDto(Guid GroupId, string GroupName, List<OwnershipCandidateDto> Candidates);
public record AccountDeletionPlanDto(bool IsLastSystemAdministrator, List<OwnedGroupDeletionDto> OwnedGroups);
public record AccountDeletionResult(bool Succeeded, string? Error = null);
public class DeleteAccountRequest
{
    [Required] public List<AccountOwnershipReplacement> OwnershipTransfers { get; set; } = [];
}
public class AccountOwnershipReplacement
{
    public Guid GroupId { get; set; }
    public Guid MemberId { get; set; }
}
