using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class Booking
    {
        [Key]
        public Guid BookingID { get; set; } = Guid.NewGuid();
        public Guid? UserID { get; set; }
        public User? User { get; set; }

        public required string ContactName { get; set; }
        public required string ContactPhone { get; set; }
        public required string ContactEmail { get; set; }

        public decimal TotalAmount { get; set; }
        public BookingStatus Status { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }

        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public ICollection<PaymentIntent> PaymentIntents { get; set; } = new List<PaymentIntent>();
        public ICollection<RefundRequest> RefundRequests { get; set; } = new List<RefundRequest>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
