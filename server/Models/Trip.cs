using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class Trip
    {
        [Key]
        public Guid TripID { get; set; } = Guid.NewGuid();
        public Guid RouteID { get; set; }
        public BusRoute? Route { get; set; }

        public Guid? BusID { get; set; }
        public Bus? Bus { get; set; }

        public Guid BusTypeID { get; set; }
        public BusType? BusType { get; set; }

        public DateOnly DepartureDate { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public TripStatus Status { get; set; }

        [Required]
        public decimal BasePrice { get; set; }

        public string? CancellationPolicy { get; set; }
        public string? Notes { get; set; }

        public ICollection<SeatHold> SeatHolds { get; set; } = new List<SeatHold>();
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
