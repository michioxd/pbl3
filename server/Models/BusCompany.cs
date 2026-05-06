using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class BusCompany
    {
        [Key]
        public Guid CompanyID { get; set; } = Guid.NewGuid();
        public required string Name { get; set; }
        public string? LicenseNumber { get; set; }
        public string? Hotline { get; set; }
        public bool IsApproved { get; set; }
        public CompanyStatus Status { get; set; } = CompanyStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<BusCompanyAdmin> BusCompanyAdmins { get; set; } =
            new List<BusCompanyAdmin>();
        public ICollection<BusAdminUpgradeRequest> BusAdminUpgradeRequests { get; set; } =
            new List<BusAdminUpgradeRequest>();
        public ICollection<CompanyProfileUpdateRequest> CompanyProfileUpdateRequests { get; set; } =
            new List<CompanyProfileUpdateRequest>();
        public ICollection<Bus> Buses { get; set; } = new List<Bus>();
        public ICollection<BusRoute> Routes { get; set; } = new List<BusRoute>();
    }
}
