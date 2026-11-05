namespace Hallen.Common.DTOs.SportsGroups;

public record GroupCreationQuotaDto(int CreatedCount, int? Limit, bool CanCreate)
{
    public int? Remaining => Limit.HasValue ? Math.Max(0, Limit.Value - CreatedCount) : null;
}
