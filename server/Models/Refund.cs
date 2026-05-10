using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class Refund
    {
        [Key]
        public Guid RefundID { get; set; } = Guid.NewGuid();
        public Guid IntentID { get; set; }
        public PaymentIntent? PaymentIntent { get; set; }

        public decimal Amount { get; set; }
        public string? Reason { get; set; }
        public RefundStatus Status { get; set; }
        public string? ProviderRequestId { get; set; }
        public long? ProviderTransactionId { get; set; }
        public int? ProviderResultCode { get; set; }
        public string? ProviderMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
    }
}
