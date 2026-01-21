using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Pbl3.Models
{
    public class BusCompany
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(200)]
        public required string Name { get; set; }

        public required string LicenseNumber { get; set; }
        public required string Hotline { get; set; }

        public float Rating { get; set; } // Cached value
        public bool IsApproved { get; set; }

        public virtual ICollection<BusCompanyAdmin>? Admins { get; set; }
        public virtual ICollection<Bus>? Buses { get; set; }
    }
}