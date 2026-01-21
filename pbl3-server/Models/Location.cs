using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pbl3.Models
{
    public class Location
    {
        [Key]
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public required string Address { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        [InverseProperty("StartLocation")]
        public virtual required ICollection<Trip> TripsStartingHere { get; set; }

        [InverseProperty("EndLocation")]
        public virtual required ICollection<Trip> TripsEndingHere { get; set; }
    }
}