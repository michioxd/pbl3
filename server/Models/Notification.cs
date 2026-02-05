using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class Notification
    {
        [Key]
        public Guid NotifID { get; set; } = Guid.NewGuid();

        public Guid UserID { get; set; }
        public User? User { get; set; }

        public Guid BookingID { get; set; }
        public Booking? Booking { get; set; }

        public NotificationType Type { get; set; }
        public required string Content { get; set; }
        public NotificationStatus Status { get; set; }
    }
}
