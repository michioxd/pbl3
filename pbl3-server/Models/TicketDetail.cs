using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pbl3.Models
{
    public class TicketDetail
    {
        [Key]
        public Guid Id { get; set; }

        public Guid TicketId { get; set; }
        public Guid TripSeatId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceAtBooking { get; set; }

        public virtual required Ticket Ticket { get; set; }
        public virtual required TripSeat TripSeat { get; set; }
    }
}