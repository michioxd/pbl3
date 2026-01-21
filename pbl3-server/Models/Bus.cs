using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pbl3.Models
{
    public class Bus
    {
        [Key]
        public Guid Id { get; set; }

        public Guid CompanyId { get; set; }

        [Required]
        public required string PlateNumber { get; set; }
        public int SeatCapacity { get; set; }

        [Column(TypeName = "jsonb")]
        public required string SeatMapConfig { get; set; }

        public virtual required BusCompany Company { get; set; }
        public virtual required ICollection<BusUtility> BusUtilities { get; set; }
        public virtual required ICollection<Trip> Trips { get; set; }
    }
}