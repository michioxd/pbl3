using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class TripSchedule
    {
        [Key]
        public Guid ScheduleID { get; set; } = Guid.NewGuid();
        public Guid RouteID { get; set; }
        public Route? Route { get; set; }

        public Guid CalendarID { get; set; }
        public Calendar? Calendar { get; set; }

        public Guid BusTypeID { get; set; }
        public BusType? BusType { get; set; }

        public TimeOnly DepartureTime { get; set; }

        public ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }
}
