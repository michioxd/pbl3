using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class BusAdminUpgradeRequest
    {
        [Key]
        public Guid RequestID { get; set; } = Guid.NewGuid();

        public Guid RequesterUserID { get; set; }
        public User? RequesterUser { get; set; }

        public Guid? ReviewedByUserID { get; set; }
        public User? ReviewedByUser { get; set; }

        public Guid? CompanyID { get; set; }
        public BusCompany? BusCompany { get; set; }

        public required string CompanyName { get; set; }
        public string? LicenseNumber { get; set; }
        public string? Hotline { get; set; }
        public string? Reason { get; set; }

        public BusAdminUpgradeRequestStatus Status { get; set; } =
            BusAdminUpgradeRequestStatus.Pending;

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewNote { get; set; }

        public ICollection<Notification> Notifications { get; set; } =
            new List<Notification>();
    }
}