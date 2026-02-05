using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class CalendarException
    {
        [Key]
        public Guid ExceptionID { get; set; } = Guid.NewGuid();
        public Guid CalendarID { get; set; }
        public Calendar? Calendar { get; set; }

        public DateOnly Date { get; set; }
        public CalendarExceptionType Type { get; set; }
        public string? Reason { get; set; }
    }
}
