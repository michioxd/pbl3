using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class Trip
    {
        [Key]
        public Guid TripID { get; set; } = Guid.NewGuid();
        public Guid? ScheduleID { get; set; }
        public TripSchedule? TripSchedule { get; set; }

        public Guid RouteID { get; set; }
        public Route? Route { get; set; }

        public Guid? BusID { get; set; }
        public Bus? Bus { get; set; }

        public Guid BusTypeID { get; set; }
        public BusType? BusType { get; set; }

        public DateOnly DepartureDate { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public TripStatus Status { get; set; }

        public ICollection<StopTime> StopTimes { get; set; } = new List<StopTime>();
        public ICollection<SeatHold> SeatHolds { get; set; } = new List<SeatHold>();
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
