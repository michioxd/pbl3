using System.ComponentModel.DataAnnotations;

namespace Pbl3.Dtos
{
    public class Infor_BusCompany
    {
        [Required]
        [StringLength(200, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [StringLength(100)]
        public string? LicenseNumber { get; set; }

        [Phone]
        public string? Hotline { get; set; }
    }

}