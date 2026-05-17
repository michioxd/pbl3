using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class CompanyProfileUpdateRequest
    {
        [Key]
        public Guid RequestID { get; set; } = Guid.NewGuid();

        public Guid CompanyID { get; set; }
        public BusCompany? BusCompany { get; set; }

        public Guid RequesterUserID { get; set; }
        public User? RequesterUser { get; set; }

        public Guid? ReviewedByUserID { get; set; }
        public User? ReviewedByUser { get; set; }

        public required string Name { get; set; }
        public string? LicenseNumber { get; set; }
        public string? Hotline { get; set; }
        public bool AllowPayOnBoard { get; set; } = true;

        public CompanyProfileUpdateRequestStatus Status { get; set; } =
            CompanyProfileUpdateRequestStatus.Pending;

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewNote { get; set; }
    }
}
