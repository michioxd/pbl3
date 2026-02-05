namespace Pbl3.Models
{
    public class RolePermission
    {
        public Guid RoleID { get; set; }
        public Role? Role { get; set; }

        public Guid PermissionID { get; set; }
        public Permission? Permission { get; set; }
    }
}
