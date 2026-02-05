using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class BusImage
    {
        [Key]
        public Guid ImageID { get; set; } = Guid.NewGuid();
        public Guid BusID { get; set; }
        public Bus? Bus { get; set; }

        public required string ImageURL { get; set; }
    }
}
