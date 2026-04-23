using System.ComponentModel.DataAnnotations;

namespace Pbl3.Dtos
{
    public class TripSearchLocationSummaryDto
    {
        public string ProvinceCode { get; set; } = default!;

        public string? DistrictCode { get; set; }

        public string? WardCode { get; set; }

        public string DisplayName { get; set; } = default!;
    }

    public class TripSearchSummaryDto
    {
        public TripSearchLocationSummaryDto Origin { get; set; } = new();

        public TripSearchLocationSummaryDto Destination { get; set; } = new();

        public DateOnly DepartureDate { get; set; }
    }

    public class TripSearchCompanyFilterOptionDto
    {
        public Guid CompanyId { get; set; }

        public string Name { get; set; } = default!;

        public int Count { get; set; }
    }

    public class TripSearchAmenityFilterOptionDto
    {
        public AmenityDto Amenity { get; set; } = default!;

        public int Count { get; set; }
    }

    public class TripSearchTimeRangeFilterOptionDto
    {
        public TimeRangeFilter Value { get; set; }

        public int Count { get; set; }
    }

    public class TripSearchPriceRangeDto
    {
        public decimal Min { get; set; }

        public decimal Max { get; set; }
    }

    public class TripSearchFilterMetadataDto
    {
        public List<TripSearchCompanyFilterOptionDto> BusCompanies { get; set; } = new();

        public List<TripSearchTimeRangeFilterOptionDto> DepartureTimeRanges { get; set; } = new();

        public List<TripSearchAmenityFilterOptionDto> Amenities { get; set; } = new();

        public TripSearchPriceRangeDto? PriceRange { get; set; }
    }

    public class TripRouteStopDto
    {
        public Guid StationId { get; set; }

        public string StationName { get; set; } = default!;

        public int StopOrder { get; set; }

        public bool IsPickUp { get; set; }

        public bool IsDropOff { get; set; }

        public int DurationFromStart { get; set; }
    }

    public class TripSearchItemDto
    {
        public Guid TripId { get; set; }

        public Guid RouteId { get; set; }

        public Guid CompanyId { get; set; }

        public string BusCompanyName { get; set; } = default!;

        public string BusTypeName { get; set; } = default!;

        public string RouteName { get; set; } = default!;

        public string DepartureLocation { get; set; } = default!;

        public string ArrivalLocation { get; set; } = default!;

        public DateTime DepartureTime { get; set; }

        public DateTime ArrivalTime { get; set; }

        public int DurationMinutes { get; set; }

        public decimal LowestPrice { get; set; }

        public int AvailableSeats { get; set; }

        public double Rating { get; set; }

        public int ReviewCount { get; set; }

        public List<AmenityDto> Amenities { get; set; } = [];

        public string? ImageUrl { get; set; }

        public List<TripRouteStopDto> PickupStops { get; set; } = [];

        public List<TripRouteStopDto> DropoffStops { get; set; } = [];
    }

    public enum TripSortBy
    {
        Default = 0,
        EarliestDeparture = 1,
        LatestDeparture = 2,
        HighestRating = 3,
        PriceAsc = 4,
        PriceDesc = 5,
    }

    public enum TimeRangeFilter
    {
        EarlyMorning = 1, // 00:00 - 06:00
        Morning = 2, // 06:00 - 12:00
        Afternoon = 3, // 12:00 - 18:00
        Evening = 4, // 18:00 - 24:00
    }

    public class TripSearchQuery
    {
        [Required]
        public string FromProvinceCode { get; set; } = default!;

        public string? FromDistrictCode { get; set; }

        public string? FromWardCode { get; set; }

        [Required]
        public string ToProvinceCode { get; set; } = default!;

        public string? ToDistrictCode { get; set; }

        public string? ToWardCode { get; set; }

        [Required]
        public DateOnly DepartureDate { get; set; }

        public TripSortBy SortBy { get; set; } = TripSortBy.Default;

        public List<TimeRangeFilter>? DepartureTimeRanges { get; set; }

        public List<Guid>? BusCompanyIds { get; set; }

        public decimal? MinPrice { get; set; }

        public decimal? MaxPrice { get; set; }

        public List<Guid>? AmenityIds { get; set; }

        public int Page { get; set; } = 1;

        public int PageSize { get; set; } = 20;
    }

    public class TripSearchResult
    {
        public int TotalResults { get; set; }

        public int Page { get; set; }

        public int PageSize { get; set; }

        public TripSearchSummaryDto Summary { get; set; } = new();

        public TripSearchFilterMetadataDto Filters { get; set; } = new();

        public List<TripSearchItemDto> Items { get; set; } = new();
    }
}
