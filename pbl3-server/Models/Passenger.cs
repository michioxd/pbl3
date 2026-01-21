using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pbl3.Models
{
    public class Passenger
    {
        [Key, ForeignKey("User")]
        public Guid UserId { get; set; }

        public int LoyaltyPoints { get; set; }
        public required string PreferredPaymentMethod { get; set; }

        public virtual required User User { get; set; }
        public virtual required ICollection<Ticket> Tickets { get; set; }
    }
}