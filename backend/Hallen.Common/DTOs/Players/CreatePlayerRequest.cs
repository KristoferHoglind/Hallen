using System.ComponentModel.DataAnnotations;

namespace Hallen.Common.DTOs.Players;

public class CreatePlayerRequest
{
    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }
}