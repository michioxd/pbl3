using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pbl3.Models
{
    public class BusCompanyAdmin
    {
        [Key, ForeignKey("User")]
        public Guid UserId { get; set; }

        public Guid CompanyId { get; set; }

        public virtual User? User { get; set; }
        public virtual BusCompany? Company { get; set; }
    }
}