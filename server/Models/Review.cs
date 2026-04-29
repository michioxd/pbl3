using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class Review
    {
        [Key]
        public Guid ReviewID { get; set; } = Guid.NewGuid();

        public Guid BookingID { get; set; }
        public Booking? Booking { get; set; }

        public Guid TripID { get; set; }
        public Trip? Trip { get; set; }

        public int RatingScore { get; set; }
        public string? Comment { get; set; }

        // Moderation tracking
        public ReviewStatus Status { get; set; } = ReviewStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ModeratedAt { get; set; }

        // Moderator reference
        public Guid? ModeratedByUserID { get; set; }
        public User? ModeratedByUser { get; set; }

        // Rejection/flag details
        public string? ModerationReason { get; set; }
        public bool IsFlagged { get; set; } = false;

        // Optional: Track reviewer (if customer accounts exist)
        public Guid? UserID { get; set; }
        public User? User { get; set; }
    }
}
