using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class Bus
    {
        [Key]
        public Guid BusID { get; set; } = Guid.NewGuid();
        public Guid CompanyID { get; set; }
        public BusCompany? BusCompany { get; set; }

        public Guid BusTypeID { get; set; }
        public BusType? BusType { get; set; }

        public required string PlateNumber { get; set; }
        public bool IsActive { get; set; }

        public ICollection<BusImage> BusImages { get; set; } = new List<BusImage>();
        public ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }
}
