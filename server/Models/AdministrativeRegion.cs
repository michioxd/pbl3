using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pbl3.Models
{
    [Table("administrative_regions")]
    public class AdministrativeRegion
    {
        [Key]
        [Column("id")]
        public int AdministrativeRegionID { get; set; }

        [Required]
        [Column("name")]
        public required string Name { get; set; }

        [Required]
        [Column("name_en")]
        public required string NameEn { get; set; }

        [Column("code_name")]
        public string? CodeName { get; set; }

        [Column("code_name_en")]
        public string? CodeNameEn { get; set; }

        public ICollection<Province> Provinces { get; set; } = new List<Province>();
    }
}
