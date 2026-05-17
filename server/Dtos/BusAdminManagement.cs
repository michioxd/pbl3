using Pbl3.Enums;

namespace Pbl3.Dtos
{
    public class UpdateCompanyProfileDto
    {
        public string Name { get; set; } = null!;
        public string? LicenseNumber { get; set; }
        public string? Hotline { get; set; }
        public bool AllowPayOnBoard { get; set; } = true;
    }

    public class CreateTripDto
    {
        public Guid RouteID { get; set; }
        public Guid? BusID { get; set; }
        public Guid BusTypeID { get; set; }
        public DateOnly DepartureDate { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public TripStatus Status { get; set; } = TripStatus.Scheduled;
    }

    public class UpdateTripDto
    {
        public Guid RouteID { get; set; }
        public Guid? BusID { get; set; }
        public Guid BusTypeID { get; set; }
        public DateOnly DepartureDate { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public TripStatus Status { get; set; }
    }

    public class UpdateTripStatusDto
    {
        public TripStatus Status { get; set; }
    }

    public class UpdateBusTypeAmenitiesDto
    {
        public string? Amenities { get; set; }
    }

    public class CreateSeatLayoutDto
    {
        public string SeatLabel { get; set; } = null!;
        public int Floor { get; set; }
        public SeatType SeatType { get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }
    }

    public class UpdateSeatLayoutDto
    {
        public string SeatLabel { get; set; } = null!;
        public int Floor { get; set; }
        public SeatType SeatType { get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }
    }
}
