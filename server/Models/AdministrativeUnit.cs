using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pbl3.Models
{
    [Table("administrative_units")]
    public class AdministrativeUnit
    {
        [Key]
        [Column("id")]
        public int AdministrativeUnitID { get; set; }

        [Column("full_name")]
        public string? FullName { get; set; }

        [Column("full_name_en")]
        public string? FullNameEn { get; set; }

        [Column("short_name")]
        public string? ShortName { get; set; }

        [Column("short_name_en")]
        public string? ShortNameEn { get; set; }

        [Column("code_name")]
        public string? CodeName { get; set; }

        [Column("code_name_en")]
        public string? CodeNameEn { get; set; }

        public ICollection<Province> Provinces { get; set; } = new List<Province>();
        public ICollection<District> Districts { get; set; } = new List<District>();
        public ICollection<Ward> Wards { get; set; } = new List<Ward>();
    }
}
