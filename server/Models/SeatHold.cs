using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class SeatHold
    {
        [Key]
        public Guid HoldID { get; set; } = Guid.NewGuid();

        public Guid TripID { get; set; }
        public Trip? Trip { get; set; }

        public Guid SeatLayoutID { get; set; }
        public SeatLayout? SeatLayout { get; set; }

        public Guid? UserID { get; set; }
        public User? User { get; set; }

        public string? SessionID { get; set; }
        public DateTime ExpiresAt { get; set; }
        public SeatHoldStatus Status { get; set; }
    }
}
