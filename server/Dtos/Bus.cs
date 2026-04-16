using System;

namespace Pbl3.Dtos
{
    public class CreateBusDto
    {
        public Guid BusTypeID { get; set; }
        public string PlateNumber { get; set; } = null!;
        public bool IsActive { get; set; }
    }

    public class UpdateBusDto
    {
        public Guid BusTypeID { get; set; }
        public string PlateNumber { get; set; } = null!;
        public bool IsActive { get; set; }
    }

    public class UpdateBusStatusDto
    {
        public bool IsActive { get; set; }
    }
}
