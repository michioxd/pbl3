using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class BusTypeAmenity
    {
        [Key]
        public Guid BusTypeAmenityID { get; set; } = Guid.NewGuid();

        [Required]
        public Guid BusTypeID { get; set; }

        public BusType? BusType { get; set; }

        [Required]
        public Guid AmenityID { get; set; }

        public Amenity? Amenity { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
