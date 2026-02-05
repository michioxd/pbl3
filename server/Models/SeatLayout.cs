using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class SeatLayout
    {
        [Key]
        public Guid LayoutID { get; set; } = Guid.NewGuid();
        public Guid BusTypeID { get; set; }
        public BusType? BusType { get; set; }

        public required string SeatLabel { get; set; }
        public int Floor { get; set; }
        public SeatType SeatType { get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }

        // Referenced by Tickets? ERD: SeatLayouts||--o{Tickets:"is booked"
        // Also SeatLayouts||--o{SeatHolds
    }
}
