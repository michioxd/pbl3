using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class Role
    {
        [Key]
        public Guid RoleID { get; set; } = Guid.NewGuid();
        public required string RoleName { get; set; }

        // Navigation properties
        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
