using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class TripSeat
    {
        [Key]
        public Guid Id { get; set; }

        public Guid TripId { get; set; }

        [Required]
        public required string SeatNumber { get; set; }

        public SeatStatus Status { get; set; }
        public DateTime? LockedAt { get; set; }

        public Guid? LockedByUserId { get; set; }

        [Timestamp]
        public required byte[] Version { get; set; }

        public virtual required Trip Trip { get; set; }

        [ForeignKey("LockedByUserId")]
        public virtual required User LockedByUser { get; set; }

        public virtual required ICollection<TicketDetail> TicketDetails { get; set; }
    }
}