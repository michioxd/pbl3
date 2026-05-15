using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    /// <summary>
    /// Junction table for many-to-many relationship between BusType and Amenity.
    /// Represents which amenities are available on a specific bus type.
    /// </summary>
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
