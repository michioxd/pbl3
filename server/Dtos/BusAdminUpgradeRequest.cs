using System.ComponentModel.DataAnnotations;

namespace Pbl3.Dtos
{
    public class ReviewBusAdminUpgradeRequestDto
    {
        [Required]
        public bool Approve { get; set; }

        [StringLength(1000)]
        public string? ReviewNote { get; set; }
    }
}
