using System.ComponentModel.DataAnnotations;

namespace Hallen.Common.DTOs.Players;

public class UpdatePlayerRequest
{
    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    public bool IsActive { get; set; }
}