using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class User
    {
        [Key]
        public Guid UserID { get; set; } = Guid.NewGuid();
        public Guid RoleID { get; set; }
        public Role? Role { get; set; }

        public required string Username { get; set; }
        public required string PasswordHash { get; set; }
        public required string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<BusCompanyAdmin> BusCompanyAdmins { get; set; } =
            new List<BusCompanyAdmin>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<Passenger> Passengers { get; set; } = new List<Passenger>();
        public ICollection<SeatHold> SeatHolds { get; set; } = new List<SeatHold>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
