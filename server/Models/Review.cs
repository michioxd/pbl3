using System.ComponentModel.DataAnnotations;

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
    }
}
