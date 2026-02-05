using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class Permission
    {
        [Key]
        public Guid PermissionID { get; set; } = Guid.NewGuid();
        public required string Code { get; set; }
        public string? Name { get; set; }

        // Navigation properties
        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}
