using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    /// <summary>
    /// Master data for amenities that can be assigned to bus types.
    /// Admin manages this table to define available amenities.
    /// </summary>
    public class Amenity
    {
        [Key]
        public Guid AmenityID { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public required string Name { get; set; }

        [MaxLength(200)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public required string IconName { get; set; }

        [Required]
        [MaxLength(50)]
        public required string Category { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<BusTypeAmenity> BusTypeAmenities { get; set; } = [];
    }
}
