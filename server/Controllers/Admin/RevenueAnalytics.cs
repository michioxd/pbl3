using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system/revenue")]
    [Authorize(Policy = "AdminOnly")]
    [Tags("SystemAdmin")]
    public class RevenueAnalytics : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RevenueAnalytics(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetRevenueAnalytics(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int topRoutesLimit = 10,
            [FromQuery] int topCompaniesLimit = 10
        )
        {
            // Default date range: Last 30 days
            var end = endDate?.Date ?? DateTime.UtcNow.Date;
            var start = startDate?.Date ?? end.AddDays(-30);

            // Get all succeeded payment intents in date range
            var payments = await _context
                .PaymentIntents.AsNoTracking()
                .Include(p => p.Booking)
                .ThenInclude(b => b!.Tickets)
                .ThenInclude(t => t.Trip)
                .ThenInclude(tr => tr!.Route)
                .ThenInclude(r => r!.BusCompany)
                .Include(p => p.Refunds)
                .Where(p => p.Status == PaymentIntentStatus.Succeeded && p.CreatedAt >= start && p.CreatedAt < end.AddDays(1))
                .ToListAsync();

            // Calculate summary
            var totalRevenue = payments.Sum(p => p.Amount);
            var totalRefunded = payments.SelectMany(p => p.Refunds).Sum(r => r.Amount);
            var netRevenue = totalRevenue - totalRefunded;
            var totalTransactions = payments.Count;
            var ticketsSold = payments.SelectMany(p => p.Booking?.Tickets ?? new List<Models.Ticket>()).Count();
            var avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

            // Calculate growth (compare with previous period)
            var periodDays = (end - start).Days + 1;
            var previousStart = start.AddDays(-periodDays);
            var previousEnd = start.AddDays(-1);

            var previousPayments = await _context
                .PaymentIntents.AsNoTracking()
                .Where(p =>
                    p.Status == PaymentIntentStatus.Succeeded
                    && p.CreatedAt >= previousStart
                    && p.CreatedAt < previousEnd.AddDays(1)
                )
                .ToListAsync();

            var previousRevenue = previousPayments.Sum(p => p.Amount);
            var previousTransactions = previousPayments.Count;

            var revenueGrowth =
                previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
            var transactionGrowth =
                previousTransactions > 0
                    ? ((totalTransactions - previousTransactions) / (decimal)previousTransactions) * 100
                    : 0;

            var summary = new RevenueSummaryDto
            {
                TotalRevenue = totalRevenue,
                TotalTransactions = totalTransactions,
                AverageTransactionValue = avgTransactionValue,
                TicketsSold = ticketsSold,
                TotalRefunded = totalRefunded,
                NetRevenue = netRevenue,
                RevenueGrowthPercent = revenueGrowth,
                TransactionGrowthPercent = transactionGrowth,
            };

            // Daily trends
            var dailyTrends = payments
                .GroupBy(p => p.CreatedAt.Date)
                .Select(g => new RevenueTrendDto
                {
                    Date = g.Key,
                    Revenue = g.Sum(p => p.Amount),
                    TransactionCount = g.Count(),
                    TicketCount = g.SelectMany(p => p.Booking?.Tickets ?? new List<Models.Ticket>()).Count(),
                    RefundAmount = g.SelectMany(p => p.Refunds).Sum(r => r.Amount),
                })
                .OrderBy(t => t.Date)
                .ToList();

            // Revenue by provider
            var byProvider = payments
                .GroupBy(p => p.Provider)
                .Select(g => new RevenueByProviderDto
                {
                    Provider = g.Key,
                    ProviderName = g.Key.ToString(),
                    Revenue = g.Sum(p => p.Amount),
                    TransactionCount = g.Count(),
                    Percentage = totalRevenue > 0 ? (g.Sum(p => p.Amount) / totalRevenue) * 100 : 0,
                })
                .OrderByDescending(p => p.Revenue)
                .ToList();

            // Top routes by revenue
            var ticketsWithRoutes = payments
                .SelectMany(p =>
                    (p.Booking?.Tickets ?? new List<Models.Ticket>()).Where(t =>
                        t.Status != TicketStatus.Cancelled && t.Trip?.Route != null
                    )
                )
                .ToList();

            var topRoutes = ticketsWithRoutes
                .GroupBy(t => new
                {
                    RouteID = t.Trip!.Route!.RouteID,
                    RouteName = t.Trip.Route.RouteName,
                    CompanyID = t.Trip.Route.CompanyID,
                    CompanyName = t.Trip.Route.BusCompany?.Name ?? "Unknown",
                })
                .Select(g => new TopRouteRevenueDto
                {
                    RouteID = g.Key.RouteID,
                    RouteName = g.Key.RouteName,
                    Revenue = g.Sum(t => t.FinalPrice),
                    TicketsSold = g.Count(),
                    AverageTicketPrice = g.Average(t => t.FinalPrice),
                    CompanyID = g.Key.CompanyID,
                    CompanyName = g.Key.CompanyName,
                })
                .OrderByDescending(r => r.Revenue)
                .Take(topRoutesLimit)
                .ToList();

            // Revenue by company
            var byCompany = ticketsWithRoutes
                .Where(t => t.Trip?.Route?.BusCompany != null)
                .GroupBy(t => new
                {
                    CompanyID = t.Trip!.Route!.CompanyID,
                    CompanyName = t.Trip.Route.BusCompany!.Name,
                })
                .Select(g => new RevenueByCompanyDto
                {
                    CompanyID = g.Key.CompanyID,
                    CompanyName = g.Key.CompanyName,
                    Revenue = g.Sum(t => t.FinalPrice),
                    TicketsSold = g.Count(),
                    TripCount = g.Select(t => t.TripID).Distinct().Count(),
                    Percentage = totalRevenue > 0 ? (g.Sum(t => t.FinalPrice) / totalRevenue) * 100 : 0,
                })
                .OrderByDescending(c => c.Revenue)
                .Take(topCompaniesLimit)
                .ToList();

            var result = new RevenueAnalyticsDto
            {
                Summary = summary,
                DailyTrends = dailyTrends,
                ByProvider = byProvider,
                TopRoutes = topRoutes,
                ByCompany = byCompany,
            };

            return Ok(result);
        }
    }
}
