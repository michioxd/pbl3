using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Globalization;

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

        // Departure location (first pickup stop)
        [Column("departure_province_code")]
        public string? DepartureProvinceCode { get; set; }

        [Column("departure_district_code")]
        public string? DepartureDistrictCode { get; set; }

        [Column("departure_ward_code")]
        public string? DepartureWardCode { get; set; }

        // Arrival location (last dropoff stop)
        [Column("arrival_province_code")]
        public string? ArrivalProvinceCode { get; set; }

        [Column("arrival_district_code")]
        public string? ArrivalDistrictCode { get; set; }

        [Column("arrival_ward_code")]
        public string? ArrivalWardCode { get; set; }

        public ICollection<BusRouteStop> BusRouteStops { get; set; } = new List<BusRouteStop>();
        public ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }
}
