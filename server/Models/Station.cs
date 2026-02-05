using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class Station
    {
        [Key]
        public Guid StationID { get; set; } = Guid.NewGuid();
        public required string Name { get; set; }
        public string? AddressDetail { get; set; }
        public string? Province { get; set; }
        public StationType Type { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public ICollection<BusRouteStop> BusRouteStops { get; set; } = new List<BusRouteStop>();
        public ICollection<StopTime> StopTimes { get; set; } = new List<StopTime>();
    }
}
