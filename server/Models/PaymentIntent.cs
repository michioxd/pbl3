using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class PaymentIntent
    {
        [Key]
        public Guid IntentID { get; set; } = Guid.NewGuid();
        public Guid BookingID { get; set; }
        public Booking? Booking { get; set; }

        public PaymentProvider Provider { get; set; }
        public decimal Amount { get; set; }
        public required string Currency { get; set; }
        public PaymentIntentStatus Status { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<PaymentCharge> PaymentCharges { get; set; } = new List<PaymentCharge>();
    }
}
