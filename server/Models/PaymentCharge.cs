using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class PaymentCharge
    {
        [Key]
        public Guid ChargeID { get; set; } = Guid.NewGuid();
        public Guid IntentID { get; set; }
        public PaymentIntent? PaymentIntent { get; set; }

        public required string ProviderTxnID { get; set; }
        public decimal Amount { get; set; }
        public PaymentChargeStatus Status { get; set; }
        public DateTime CapturedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
    }
}
