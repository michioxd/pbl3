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
        public string? ProviderOrderId { get; set; }
        public string? ProviderRequestId { get; set; }
        public string? PayUrl { get; set; }
        public string? QrCodeUrl { get; set; }
        public string? Deeplink { get; set; }
        public long? ProviderTransactionId { get; set; }
        public int? ProviderResultCode { get; set; }
        public string? ProviderMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaidAt { get; set; }

        public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
    }
}
