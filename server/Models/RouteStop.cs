using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class BusRouteStop
    {
        [Key]
        public Guid BusRouteStopID { get; set; } = Guid.NewGuid();
        public Guid RouteID { get; set; }
        public BusRoute? Route { get; set; }

        public Guid StationID { get; set; }
        public Station? Station { get; set; }

        public int StopOrder { get; set; }
        public bool IsPickUp { get; set; }
        public bool IsDropOff { get; set; }
        public int DurationFromStart { get; set; } // Minutes
    }
}
