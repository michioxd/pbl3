using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class Utility
    {
        [Key]
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public required string Icon { get; set; }

        public virtual required ICollection<BusUtility> BusUtilities { get; set; }
    }
}