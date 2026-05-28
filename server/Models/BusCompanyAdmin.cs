using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class BusCompanyAdmin
    {
        [Key]
        public Guid UserID { get; set; }
        public User? User { get; set; }

        public Guid CompanyID { get; set; }
        public BusCompany? BusCompany { get; set; }
        public string Roles { get; set; } = string.Empty;
    }
}



