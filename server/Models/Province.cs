using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pbl3.Models
{
    [Table("provinces")]
    public class Province
    {
        [Key]
        [Column("code")]
        public required string Code { get; set; }

        [Required]
        [Column("name")]
        public required string Name { get; set; }

        [Column("name_en")]
        public string? NameEn { get; set; }

        [Required]
        [Column("full_name")]
        public required string FullName { get; set; }

        [Column("full_name_en")]
        public string? FullNameEn { get; set; }

        [Column("code_name")]
        public string? CodeName { get; set; }

        [Column("administrative_unit_id")]
        public int? AdministrativeUnitID { get; set; }
        public AdministrativeUnit? AdministrativeUnit { get; set; }

        [Column("administrative_region_id")]
        public int? AdministrativeRegionID { get; set; }
        public AdministrativeRegion? AdministrativeRegion { get; set; }

        public ICollection<District> Districts { get; set; } = new List<District>();
        public ICollection<Station> Stations { get; set; } = new List<Station>();
    }
}
