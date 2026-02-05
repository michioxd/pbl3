using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class StopTime
    {
        [Key]
        public Guid StopTimeID { get; set; } = Guid.NewGuid();
        public Guid TripID { get; set; }
        public Trip? Trip { get; set; }

        public Guid StationID { get; set; }
        public Station? Station { get; set; }

        public DateTime ArrivalTime { get; set; }
        public DateTime DepartureTime { get; set; }
        public int StopSequence { get; set; }
    }
}
