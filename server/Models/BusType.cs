using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class BusType
    {
        [Key]
        public Guid BusTypeID { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public required string Name { get; set; }

        public int TotalSeats { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<SeatLayout> SeatLayouts { get; set; } = new List<SeatLayout>();
        public ICollection<Bus> Buses { get; set; } = new List<Bus>();
        public ICollection<Trip> Trips { get; set; } = new List<Trip>();
        public ICollection<BusTypeAmenity> BusTypeAmenities { get; set; } = [];
    }
}
