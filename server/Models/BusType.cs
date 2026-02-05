using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class BusType
    {
        [Key]
        public Guid BusTypeID { get; set; } = Guid.NewGuid();
        public required string Name { get; set; }
        public int TotalSeats { get; set; }
        public string? Description { get; set; }

        public ICollection<SeatLayout> SeatLayouts { get; set; } = new List<SeatLayout>();
        public ICollection<Bus> Buses { get; set; } = new List<Bus>();
        public ICollection<TripSchedule> TripSchedules { get; set; } = new List<TripSchedule>();
        public ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }
}
