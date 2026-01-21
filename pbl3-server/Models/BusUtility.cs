using System;

namespace Pbl3.Models
{
    public class BusUtility
    {
        public Guid BusId { get; set; }
        public Guid UtilityId { get; set; }

        public virtual required Bus Bus { get; set; }
        public virtual required Utility Utility { get; set; }
    }
}