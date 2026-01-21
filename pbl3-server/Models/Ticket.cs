using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class Ticket
    {
        [Key]
        public Guid Id { get; set; }

        public Guid TripId { get; set; }
        public Guid PassengerId { get; set; }

        public DateTime BookingDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public TicketStatus Status { get; set; }
        public required string QRCode { get; set; }

        public virtual required Trip Trip { get; set; }
        [ForeignKey("PassengerId")]
        public virtual required Passenger Passenger { get; set; }

        public virtual required ICollection<TicketDetail> TicketDetails { get; set; }
    }
}