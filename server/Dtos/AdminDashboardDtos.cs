namespace Pbl3.Dtos
{
    public class AdminDashboardOverviewDto
    {
        public string CurrentMonthLabel { get; set; } = string.Empty;
        public DateTime LastUpdatedAt { get; set; }
        public AdminDashboardKpiDto Revenue { get; set; } = new();
        public AdminDashboardKpiDto SoldTickets { get; set; } = new();
        public AdminDashboardKpiDto TotalTrips { get; set; } = new();
        public AdminDashboardKpiDto NewUsers { get; set; } = new();
        public AdminDashboardSnapshotDto Snapshot { get; set; } = new();
        public List<AdminDashboardMonthlyStatDto> MonthlyStats { get; set; } = new();
        public List<AdminDashboardDailyStatDto> DailyStats { get; set; } = new();
        public List<AdminDashboardTopRouteDto> TopRoutes { get; set; } = new();
        public List<AdminDashboardRecentBookingDto> RecentBookings { get; set; } = new();
        public List<AdminDashboardStatusStatDto> TicketStatusBreakdown { get; set; } = new();
        public List<AdminDashboardStatusStatDto> UpgradeRequestBreakdown { get; set; } = new();
    }

    public class AdminDashboardKpiDto
    {
        public decimal Current { get; set; }
        public decimal Previous { get; set; }
        public decimal Delta { get; set; }
        public decimal DeltaPercent { get; set; }
    }

    public class AdminDashboardSnapshotDto
    {
        public int TotalUsers { get; set; }
        public int TotalCompanies { get; set; }
        public int ApprovedCompanies { get; set; }
        public int TotalRoutes { get; set; }
        public int ActiveTripsToday { get; set; }
        public int TotalTripsThisMonth { get; set; }
        public int PendingUpgradeRequests { get; set; }
        public decimal CancellationRatePercent { get; set; }
        public decimal AverageTicketPrice { get; set; }
    }

    public class AdminDashboardMonthlyStatDto
    {
        public string Label { get; set; } = string.Empty;
        public string MonthKey { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int SoldTickets { get; set; }
    }

    public class AdminDashboardDailyStatDto
    {
        public string Date { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int SoldTickets { get; set; }
        public int CancelledTickets { get; set; }
        public decimal Revenue { get; set; }
    }

    public class AdminDashboardTopRouteDto
    {
        public string RouteName { get; set; } = string.Empty;
        public int TicketsSold { get; set; }
        public decimal Revenue { get; set; }
    }

    public class AdminDashboardRecentBookingDto
    {
        public Guid BookingId { get; set; }
        public string ContactName { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public int TicketCount { get; set; }
        public string RouteName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class AdminDashboardStatusStatDto
    {
        public string Label { get; set; } = string.Empty;
        public int Value { get; set; }
    }
}
