using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class RefundRequest
    {
        [Key]
        public Guid RefundRequestID { get; set; } = Guid.NewGuid();

        public Guid BookingID { get; set; }
        public Booking? Booking { get; set; }

        public Guid PaymentIntentID { get; set; }
        public PaymentIntent? PaymentIntent { get; set; }

        public Guid? UserID { get; set; }
        public User? User { get; set; }

        public decimal RequestedAmount { get; set; }
        public required string Reason { get; set; }
        public RefundStatus Status { get; set; } = RefundStatus.Pending;
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }

        public Guid? ProcessedByUserID { get; set; }
        public User? ProcessedByUser { get; set; }

        public string? AdminNotes { get; set; }

        // Link to actual refund when processed
        public Guid? RefundID { get; set; }
        public Refund? Refund { get; set; }
    }
}
