namespace Pbl3.Dtos
{
    public class TripDetailRouteStopDto
    {
        public Guid StationId { get; set; }

        public string StationName { get; set; } = default!;

        public string? ProvinceCode { get; set; }

        public string? DistrictCode { get; set; }

        public string? WardCode { get; set; }

        public string? AddressDetail { get; set; }

        public int StopOrder { get; set; }

        public bool IsPickUp { get; set; }

        public bool IsDropOff { get; set; }

        public int DurationFromStart { get; set; }
    }

    public class TripDetailDto
    {
        public Guid TripId { get; set; }

        public Guid RouteId { get; set; }

        public Guid CompanyId { get; set; }

        public string BusCompanyName { get; set; } = default!;

        public string BusTypeName { get; set; } = default!;

        public string? BusTypeDescription { get; set; }

        public string RouteName { get; set; } = default!;

        public DateOnly DepartureDate { get; set; }

        public DateTime DepartureTime { get; set; }

        public DateTime ArrivalTime { get; set; }

        public int DurationMinutes { get; set; }

        public int TotalSeats { get; set; }

        public int AvailableSeats { get; set; }

        public decimal BasePrice { get; set; }

        public decimal LowestPrice { get; set; }

        public double Rating { get; set; }

        public int ReviewCount { get; set; }

        public List<AmenityDto> Amenities { get; set; } = [];

        public List<string> Images { get; set; } = [];

        public List<TripDetailRouteStopDto> PickupStops { get; set; } = [];

        public List<TripDetailRouteStopDto> DropoffStops { get; set; } = [];

        public string? CancellationPolicy { get; set; }

        public string? Notes { get; set; }
    }
}
