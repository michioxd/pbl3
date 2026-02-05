using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class Passenger
    {
        [Key]
        public Guid PassengerID { get; set; } = Guid.NewGuid();
        public Guid? UserID { get; set; }
        public User? User { get; set; }

        public required string FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? IdentityCard { get; set; }
        public string? Email { get; set; }

        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
