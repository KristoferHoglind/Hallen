using System.ComponentModel.DataAnnotations;

namespace Hallen.Common.DTOs.SportsGroups;

public class CreateSportsGroupRequest
{
    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }
}