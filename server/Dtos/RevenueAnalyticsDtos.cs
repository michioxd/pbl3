using Pbl3.Enums;

namespace Pbl3.Dtos
{
    // Main revenue analytics response
    public class RevenueAnalyticsDto
    {
        public RevenueSummaryDto Summary { get; set; } = new();
        public List<RevenueTrendDto> DailyTrends { get; set; } = new();
        public List<RevenueByProviderDto> ByProvider { get; set; } = new();
        public List<TopRouteRevenueDto> TopRoutes { get; set; } = new();
        public List<RevenueByCompanyDto> ByCompany { get; set; } = new();
    }

    // Summary KPIs
    public class RevenueSummaryDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalTransactions { get; set; }
        public decimal AverageTransactionValue { get; set; }
        public int TicketsSold { get; set; }
        public decimal TotalRefunded { get; set; }
        public decimal NetRevenue { get; set; } // Total - Refunded

        // Comparison với previous period
        public decimal RevenueGrowthPercent { get; set; }
        public decimal TransactionGrowthPercent { get; set; }
    }

    // Daily/Monthly revenue trends
    public class RevenueTrendDto
    {
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public int TransactionCount { get; set; }
        public int TicketCount { get; set; }
        public decimal RefundAmount { get; set; }
    }

    // Revenue by payment provider
    public class RevenueByProviderDto
    {
        public PaymentProvider Provider { get; set; }
        public string ProviderName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int TransactionCount { get; set; }
        public decimal Percentage { get; set; }
    }

    // Top routes by revenue
    public class TopRouteRevenueDto
    {
        public Guid RouteID { get; set; }
        public string RouteName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int TicketsSold { get; set; }
        public decimal AverageTicketPrice { get; set; }
        public Guid CompanyID { get; set; }
        public string CompanyName { get; set; } = string.Empty;
    }

    // Revenue by company
    public class RevenueByCompanyDto
    {
        public Guid CompanyID { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int TicketsSold { get; set; }
        public int TripCount { get; set; }
        public decimal Percentage { get; set; }
    }
}
