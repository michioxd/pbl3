using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class Trip
    {
        [Key]
        public Guid Id { get; set; }

        public Guid BusId { get; set; }
        public Guid StartLocationId { get; set; }
        public Guid EndLocationId { get; set; }

        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }

        public int AvailableSeats { get; set; }
        public TripStatus Status { get; set; }

        public virtual required Bus Bus { get; set; }

        [ForeignKey("StartLocationId")]
        public virtual required Location StartLocation { get; set; }

        [ForeignKey("EndLocationId")]
        public virtual required Location EndLocation { get; set; }

        public virtual required ICollection<TripSeat> TripSeats { get; set; }
        public virtual required ICollection<Ticket> Tickets { get; set; }
    }
}