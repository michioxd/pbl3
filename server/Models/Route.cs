using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class BusRoute
    {
        [Key]
        public Guid RouteID { get; set; } = Guid.NewGuid();
        public Guid CompanyID { get; set; }
        public BusCompany? BusCompany { get; set; }

        public required string RouteName { get; set; }
        public decimal DistanceEstimate { get; set; }
        public decimal DurationEstimate { get; set; }
        public bool IsActive { get; set; }

        public ICollection<BusRouteStop> BusRouteStops { get; set; } = new List<BusRouteStop>();
        public ICollection<TripSchedule> TripSchedules { get; set; } = new List<TripSchedule>();
        public ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }
}
