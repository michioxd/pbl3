using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class Ticket
    {
        [Key]
        public Guid TicketID { get; set; } = Guid.NewGuid();

        public Guid BookingID { get; set; }
        public Booking? Booking { get; set; }

        public Guid TripID { get; set; }
        public Trip? Trip { get; set; }

        public Guid PassengerID { get; set; }
        public Passenger? Passenger { get; set; }

        public Guid SeatLayoutID { get; set; }
        public SeatLayout? SeatLayout { get; set; }

        public decimal FinalPrice { get; set; }
        public TicketStatus Status { get; set; }
        public required string TicketCode { get; set; }
        public string? QrCode { get; set; }
    }
}
