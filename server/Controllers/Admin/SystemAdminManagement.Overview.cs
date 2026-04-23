using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpGet("dashboard/overview")]
        public async Task<ActionResult<AdminDashboardOverviewDto>> GetDashboardOverview()
        {
            var now = DateTime.UtcNow;
            var currentMonthStart = new DateOnly(now.Year, now.Month, 1);
            var nextMonthStart = currentMonthStart.AddMonths(1);
            var previousMonthStart = currentMonthStart.AddMonths(-1);
            var currentMonthStartAt = new DateTime(
                now.Year,
                now.Month,
                1,
                0,
                0,
                0,
                DateTimeKind.Utc
            );
            var nextMonthStartAt = currentMonthStartAt.AddMonths(1);
            var previousMonthStartAt = currentMonthStartAt.AddMonths(-1);
            var today = DateOnly.FromDateTime(now);
            var sixMonthsAgo = currentMonthStart.AddMonths(-5);

            var currentMonthTickets = _context
                .Tickets.AsNoTracking()
                .Where(t =>
                    t.Trip != null
                    && t.Trip.DepartureDate >= currentMonthStart
                    && t.Trip.DepartureDate < nextMonthStart
                );

            var previousMonthTickets = _context
                .Tickets.AsNoTracking()
                .Where(t =>
                    t.Trip != null
                    && t.Trip.DepartureDate >= previousMonthStart
                    && t.Trip.DepartureDate < currentMonthStart
                );

            var currentRevenue =
                (
                    await currentMonthTickets
                        .Where(t => t.Status != TicketStatus.Cancelled)
                        .SumAsync(t => (decimal?)t.FinalPrice)
                ) ?? 0m;

            var previousRevenue =
                (
                    await previousMonthTickets
                        .Where(t => t.Status != TicketStatus.Cancelled)
                        .SumAsync(t => (decimal?)t.FinalPrice)
                ) ?? 0m;

            var currentSoldTickets = await currentMonthTickets.CountAsync(t =>
                t.Status != TicketStatus.Cancelled
            );

            var previousSoldTickets = await previousMonthTickets.CountAsync(t =>
                t.Status != TicketStatus.Cancelled
            );

            var currentTrips = await _context
                .Trips.AsNoTracking()
                .CountAsync(t =>
                    t.DepartureDate >= currentMonthStart && t.DepartureDate < nextMonthStart
                );

            var previousTrips = await _context
                .Trips.AsNoTracking()
                .CountAsync(t =>
                    t.DepartureDate >= previousMonthStart && t.DepartureDate < currentMonthStart
                );

            var currentNewUsers = await _context
                .Users.AsNoTracking()
                .CountAsync(u =>
                    u.CreatedAt >= currentMonthStartAt && u.CreatedAt < nextMonthStartAt
                );

            var previousNewUsers = await _context
                .Users.AsNoTracking()
                .CountAsync(u =>
                    u.CreatedAt >= previousMonthStartAt && u.CreatedAt < currentMonthStartAt
                );

            var currentTotalTickets = await currentMonthTickets.CountAsync();
            var currentCancelledTickets = await currentMonthTickets.CountAsync(t =>
                t.Status == TicketStatus.Cancelled
            );
            var currentCheckedInTickets = await currentMonthTickets.CountAsync(t =>
                t.Status == TicketStatus.CheckedIn
            );

            var totalUsers = await _context.Users.AsNoTracking().CountAsync();
            var totalCompanies = await _context.BusCompanies.AsNoTracking().CountAsync();
            var approvedCompanies = await _context
                .BusCompanies.AsNoTracking()
                .CountAsync(c => c.IsApproved);
            var totalRoutes = await _context.BusRoutes.AsNoTracking().CountAsync();
            var activeTripsToday = await _context
                .Trips.AsNoTracking()
                .CountAsync(t => t.DepartureDate == today && t.Status != TripStatus.Cancelled);
            var pendingUpgradeRequests = await _context
                .BusAdminUpgradeRequests.AsNoTracking()
                .CountAsync(r => r.Status == BusAdminUpgradeRequestStatus.Pending);

            var monthlyStatsRaw = await _context
                .Tickets.AsNoTracking()
                .Where(t =>
                    t.Trip != null
                    && t.Trip.DepartureDate >= sixMonthsAgo
                    && t.Trip.DepartureDate < nextMonthStart
                )
                .GroupBy(t => new { t.Trip!.DepartureDate.Year, t.Trip.DepartureDate.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    Revenue = g.Where(x => x.Status != TicketStatus.Cancelled)
                        .Sum(x => x.FinalPrice),
                    SoldTickets = g.Count(x => x.Status != TicketStatus.Cancelled),
                })
                .ToListAsync();

            var monthlyLookup = monthlyStatsRaw.ToDictionary(
                x => $"{x.Year:D4}-{x.Month:D2}",
                x => x
            );

            var monthlyStats = Enumerable
                .Range(0, 6)
                .Select(index =>
                {
                    var monthDate = currentMonthStart.AddMonths(index - 5);
                    var monthKey = $"{monthDate.Year:D4}-{monthDate.Month:D2}";
                    monthlyLookup.TryGetValue(monthKey, out var monthValue);

                    return new AdminDashboardMonthlyStatDto
                    {
                        Label = $"T{monthDate.Month}/{monthDate.Year}",
                        MonthKey = monthKey,
                        Revenue = monthValue?.Revenue ?? 0m,
                        SoldTickets = monthValue?.SoldTickets ?? 0,
                    };
                })
                .ToList();

            var dailyStatsRaw = await currentMonthTickets
                .GroupBy(t => t.Trip!.DepartureDate)
                .Select(g => new
                {
                    Date = g.Key,
                    SoldTickets = g.Count(x => x.Status != TicketStatus.Cancelled),
                    CancelledTickets = g.Count(x => x.Status == TicketStatus.Cancelled),
                    Revenue = g.Where(x => x.Status != TicketStatus.Cancelled)
                        .Sum(x => x.FinalPrice),
                })
                .ToListAsync();

            var dailyLookup = dailyStatsRaw.ToDictionary(x => x.Date, x => x);
            var totalDaysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
            var dailyStats = Enumerable
                .Range(1, totalDaysInMonth)
                .Select(day =>
                {
                    var date = new DateOnly(now.Year, now.Month, day);
                    dailyLookup.TryGetValue(date, out var dayValue);

                    return new AdminDashboardDailyStatDto
                    {
                        Date = date.ToString("yyyy-MM-dd"),
                        Label = date.ToString("dd/MM"),
                        SoldTickets = dayValue?.SoldTickets ?? 0,
                        CancelledTickets = dayValue?.CancelledTickets ?? 0,
                        Revenue = dayValue?.Revenue ?? 0m,
                    };
                })
                .ToList();

            var topRoutes = await currentMonthTickets
                .Where(t =>
                    t.Status != TicketStatus.Cancelled && t.Trip != null && t.Trip.Route != null
                )
                .GroupBy(t => t.Trip!.Route!.RouteName)
                .Select(g => new AdminDashboardTopRouteDto
                {
                    RouteName = g.Key,
                    TicketsSold = g.Count(),
                    Revenue = g.Sum(x => x.FinalPrice),
                })
                .OrderByDescending(x => x.TicketsSold)
                .ThenByDescending(x => x.Revenue)
                .Take(5)
                .ToListAsync();

            var recentBookings = await _context
                .Bookings.AsNoTracking()
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.Trip)
                        .ThenInclude(tr => tr!.Route)
                .OrderByDescending(b => b.CreatedAt)
                .Take(6)
                .ToListAsync();

            var recentBookingDtos = recentBookings
                .Select(booking =>
                {
                    var routeNames = booking
                        .Tickets.Select(t => t.Trip?.Route?.RouteName)
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .Distinct()
                        .ToList();

                    var routeName = routeNames.Count switch
                    {
                        0 => "Chưa xác định tuyến",
                        1 => routeNames[0]!,
                        _ => $"{routeNames[0]} và {routeNames.Count - 1} tuyến khác",
                    };

                    return new AdminDashboardRecentBookingDto
                    {
                        BookingId = booking.BookingID,
                        ContactName = booking.ContactName,
                        ContactEmail = booking.ContactEmail,
                        TotalAmount = booking.TotalAmount,
                        TicketCount = booking.Tickets.Count,
                        RouteName = routeName,
                        Status = booking.Status.ToString(),
                        CreatedAt = booking.CreatedAt,
                    };
                })
                .ToList();

            var upgradeRequestBreakdownRaw = await _context
                .BusAdminUpgradeRequests.AsNoTracking()
                .Where(r =>
                    r.RequestedAt >= currentMonthStartAt && r.RequestedAt < nextMonthStartAt
                )
                .GroupBy(r => r.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var upgradeLookup = upgradeRequestBreakdownRaw.ToDictionary(
                x => x.Status,
                x => x.Count
            );

            var cancellationRate =
                currentTotalTickets == 0
                    ? 0m
                    : Math.Round((decimal)currentCancelledTickets * 100m / currentTotalTickets, 2);
            var averageTicketPrice =
                currentSoldTickets == 0 ? 0m : Math.Round(currentRevenue / currentSoldTickets, 0);

            var response = new AdminDashboardOverviewDto
            {
                CurrentMonthLabel = $"Tháng {currentMonthStart.Month}/{currentMonthStart.Year}",
                LastUpdatedAt = now,
                Revenue = BuildKpi(currentRevenue, previousRevenue),
                SoldTickets = BuildKpi(currentSoldTickets, previousSoldTickets),
                TotalTrips = BuildKpi(currentTrips, previousTrips),
                NewUsers = BuildKpi(currentNewUsers, previousNewUsers),
                Snapshot = new AdminDashboardSnapshotDto
                {
                    TotalUsers = totalUsers,
                    TotalCompanies = totalCompanies,
                    ApprovedCompanies = approvedCompanies,
                    TotalRoutes = totalRoutes,
                    ActiveTripsToday = activeTripsToday,
                    TotalTripsThisMonth = currentTrips,
                    PendingUpgradeRequests = pendingUpgradeRequests,
                    CancellationRatePercent = cancellationRate,
                    AverageTicketPrice = averageTicketPrice,
                },
                MonthlyStats = monthlyStats,
                DailyStats = dailyStats,
                TopRoutes = topRoutes,
                RecentBookings = recentBookingDtos,
                TicketStatusBreakdown = new List<AdminDashboardStatusStatDto>
                {
                    new AdminDashboardStatusStatDto
                    {
                        Label = "Đã phát hành",
                        Value = Math.Max(currentSoldTickets - currentCheckedInTickets, 0),
                    },
                    new AdminDashboardStatusStatDto
                    {
                        Label = "Đã check-in",
                        Value = currentCheckedInTickets,
                    },
                    new AdminDashboardStatusStatDto
                    {
                        Label = "Đã hủy",
                        Value = currentCancelledTickets,
                    },
                },
                UpgradeRequestBreakdown = new List<AdminDashboardStatusStatDto>
                {
                    new AdminDashboardStatusStatDto
                    {
                        Label = "Chờ duyệt",
                        Value = upgradeLookup.GetValueOrDefault(
                            BusAdminUpgradeRequestStatus.Pending
                        ),
                    },
                    new AdminDashboardStatusStatDto
                    {
                        Label = "Đã duyệt",
                        Value = upgradeLookup.GetValueOrDefault(
                            BusAdminUpgradeRequestStatus.Approved
                        ),
                    },
                    new AdminDashboardStatusStatDto
                    {
                        Label = "Từ chối",
                        Value = upgradeLookup.GetValueOrDefault(
                            BusAdminUpgradeRequestStatus.Rejected
                        ),
                    },
                },
            };

            return Ok(response);
        }

        private static AdminDashboardKpiDto BuildKpi(decimal current, decimal previous)
        {
            var delta = current - previous;
            decimal deltaPercent;

            if (previous == 0)
            {
                deltaPercent = current == 0 ? 0m : 100m;
            }
            else
            {
                deltaPercent = Math.Round(delta * 100m / previous, 2);
            }

            return new AdminDashboardKpiDto
            {
                Current = current,
                Previous = previous,
                Delta = delta,
                DeltaPercent = deltaPercent,
            };
        }
    }
}
