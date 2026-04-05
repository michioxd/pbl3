using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pbl3.Models
{
    [Table("districts")]
    public class District
    {
        [Key]
        [Column("code")]
        public required string Code { get; set; }

        [Required]
        [Column("name")]
        public required string Name { get; set; }

        [Column("name_en")]
        public string? NameEn { get; set; }

        [Column("full_name")]
        public string? FullName { get; set; }

        [Column("full_name_en")]
        public string? FullNameEn { get; set; }

        [Column("code_name")]
        public string? CodeName { get; set; }

        [Column("province_code")]
        public string? ProvinceCode { get; set; }
        public Province? Province { get; set; }

        [Column("administrative_unit_id")]
        public int? AdministrativeUnitID { get; set; }
        public AdministrativeUnit? AdministrativeUnit { get; set; }

        public ICollection<Ward> Wards { get; set; } = new List<Ward>();
        public ICollection<Station> Stations { get; set; } = new List<Station>();
    }
}
