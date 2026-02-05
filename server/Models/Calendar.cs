using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class Calendar
    {
        [Key]
        public Guid CalendarID { get; set; } = Guid.NewGuid();
        public required string Name { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }

        public bool Mon { get; set; }
        public bool Tue { get; set; }
        public bool Wed { get; set; }
        public bool Thu { get; set; }
        public bool Fri { get; set; }
        public bool Sat { get; set; }
        public bool Sun { get; set; }

        public ICollection<CalendarException> CalendarExceptions { get; set; } = new List<CalendarException>();
        public ICollection<TripSchedule> TripSchedules { get; set; } = new List<TripSchedule>();
    }
}
