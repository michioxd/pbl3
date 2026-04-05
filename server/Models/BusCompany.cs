using System.ComponentModel.DataAnnotations;

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

        public ICollection<BusCompanyAdmin> BusCompanyAdmins { get; set; } =
            new List<BusCompanyAdmin>();
        public ICollection<Bus> Buses { get; set; } = new List<Bus>();
        public ICollection<BusRoute> Routes { get; set; } = new List<BusRoute>();
    }
}
