using System.ComponentModel.DataAnnotations;

namespace Pbl3.Dtos
{
    public class UpdatePassengerDto
    {
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? IdentityCard { get; set; }
    }

    public class CreateBusAdminUpgradeRequestDto
    {
        [Required]
        [StringLength(200, MinimumLength = 2)]
        public string CompanyName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? LicenseNumber { get; set; }

        [Phone]
        public string? Hotline { get; set; }

        [StringLength(1000)]
        public string? Reason { get; set; }
    }
}
