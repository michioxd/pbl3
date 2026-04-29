namespace Pbl3.Dtos
{
    public class TripMonitoringListItemDto
    {
        public Guid TripID { get; set; }
        public string RouteName { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string? BusPlateNumber { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public int Status { get; set; }
        public int TotalSeats { get; set; }
        public int BookedSeats { get; set; }
        public decimal Revenue { get; set; }
    }

    public class TripMonitoringSummaryDto
    {
        public int TotalTrips { get; set; }
        public int ActiveTrips { get; set; }
        public int ScheduledTrips { get; set; }
        public int CompletedTrips { get; set; }
        public int CancelledTrips { get; set; }
        public decimal TotalRevenue { get; set; }
        public double AverageOccupancy { get; set; }
    }

    public class TripsMonitoringListResponseDto
    {
        public List<TripMonitoringListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int FilteredCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public TripMonitoringSummaryDto Summary { get; set; } = new();
    }

    public class RoutePerformanceDto
    {
        public Guid RouteID { get; set; }
        public string RouteName { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public int TotalTrips { get; set; }
        public int CompletedTrips { get; set; }
        public int CancelledTrips { get; set; }
        public double CompletionRate { get; set; }
        public double AverageOccupancy { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class RoutePerformanceListResponseDto
    {
        public List<RoutePerformanceDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
    }
}
