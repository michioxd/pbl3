using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class AuditLog
    {
        [Key]
        public Guid LogID { get; set; } = Guid.NewGuid();

        public Guid UserID { get; set; }
        public User? User { get; set; }

        public required string Action { get; set; }
        public required string EntityName { get; set; }
        public required string EntityID { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
