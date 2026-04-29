using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Admin
{
    [Authorize(Roles = "SysAdmin")]
    [Route("api/admin/system/trips")]
    [ApiController]
    public class TripMonitoringController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TripMonitoringController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTrips(
            [FromQuery] string? q,
            [FromQuery] List<string>? statuses,
            [FromQuery] Guid? companyId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortDirection,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
                return BadRequest(new { message = "page >= 1" });
            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
                return BadRequest(new { message = "pageSize: 25, 50, 100, 200" });

            var query = _context
                .Trips.AsNoTracking()
                .Include(t => t.Route)
                    .ThenInclude(r => r!.BusCompany)
                .Include(t => t.Bus)
                .Include(t => t.BusType)
                .Include(t => t.Tickets)
                .AsQueryable();

            // Search filter
            if (!string.IsNullOrWhiteSpace(q))
            {
                var keyword = $"%{q.Trim()}%";
                query = query.Where(t =>
                    EF.Functions.ILike(t.Route!.RouteName, keyword)
                    || (t.Bus != null && EF.Functions.ILike(t.Bus.PlateNumber, keyword))
                    || EF.Functions.ILike(t.Route!.BusCompany!.Name, keyword)
                );
            }

            // Status filter
            if (statuses != null && statuses.Count > 0)
            {
                var statusEnums = statuses
                    .SelectMany(s => s.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    .Select(s => Enum.Parse<TripStatus>(s, true))
                    .ToHashSet();
                query = query.Where(t => statusEnums.Contains(t.Status));
            }

            // Company filter
            if (companyId.HasValue)
                query = query.Where(t => t.Route!.CompanyID == companyId.Value);

            // Date filter
            if (startDate.HasValue)
                query = query.Where(t => t.DepartureTime >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(t => t.DepartureTime <= endDate.Value.AddDays(1));

            // Sorting
            query = (sortBy ?? "").ToLowerInvariant() switch
            {
                "route" => sortDirection == "asc"
                    ? query.OrderBy(t => t.Route!.RouteName)
                    : query.OrderByDescending(t => t.Route!.RouteName),
                "status" => sortDirection == "asc"
                    ? query.OrderBy(t => t.Status)
                    : query.OrderByDescending(t => t.Status),
                "company" => sortDirection == "asc"
                    ? query.OrderBy(t => t.Route!.BusCompany!.Name)
                    : query.OrderByDescending(t => t.Route!.BusCompany!.Name),
                _ => query.OrderByDescending(t => t.DepartureTime),
            };

            var filteredCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(filteredCount / (double)pageSize);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new TripMonitoringListItemDto
                {
                    TripID = t.TripID,
                    RouteName = t.Route!.RouteName,
                    CompanyName = t.Route!.BusCompany!.Name,
                    BusPlateNumber = t.Bus != null ? t.Bus.PlateNumber : null,
                    DepartureTime = t.DepartureTime,
                    ArrivalTime = t.ArrivalTime,
                    Status = (int)t.Status,
                    TotalSeats = t.BusType!.TotalSeats,
                    BookedSeats = t.Tickets.Count(tk =>
                        tk.Status == TicketStatus.Issued || tk.Status == TicketStatus.CheckedIn
                    ),
                    Revenue = t
                        .Tickets.Where(tk =>
                            tk.Status == TicketStatus.Issued || tk.Status == TicketStatus.CheckedIn
                        )
                        .Sum(tk => tk.FinalPrice),
                })
                .ToListAsync();

            // Summary
            var allTrips = await _context
                .Trips.AsNoTracking()
                .Include(t => t.Tickets)
                .Include(t => t.BusType)
                .ToListAsync();

            var now = DateTime.UtcNow;
            var summary = new TripMonitoringSummaryDto
            {
                TotalTrips = allTrips.Count,
                ActiveTrips = allTrips.Count(t =>
                    t.Status == TripStatus.Running || t.Status == TripStatus.Scheduled
                ),
                ScheduledTrips = allTrips.Count(t => t.Status == TripStatus.Scheduled),
                CompletedTrips = allTrips.Count(t => t.Status == TripStatus.Completed),
                CancelledTrips = allTrips.Count(t => t.Status == TripStatus.Cancelled),
                TotalRevenue = allTrips.Sum(t =>
                    t.Tickets.Where(tk =>
                            tk.Status == TicketStatus.Issued || tk.Status == TicketStatus.CheckedIn
                        )
                        .Sum(tk => tk.FinalPrice)
                ),
                AverageOccupancy =
                    allTrips.Count > 0
                        ? allTrips
                            .Where(t => t.BusType != null && t.BusType.TotalSeats > 0)
                            .Average(t =>
                                (double)
                                    t.Tickets.Count(tk =>
                                        tk.Status == TicketStatus.Issued
                                        || tk.Status == TicketStatus.CheckedIn
                                    )
                                / t.BusType!.TotalSeats
                                * 100
                            )
                        : 0,
            };

            return Ok(
                new TripsMonitoringListResponseDto
                {
                    Items = items,
                    TotalCount = allTrips.Count,
                    FilteredCount = filteredCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = totalPages,
                    Summary = summary,
                }
            );
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveTrips()
        {
            var now = DateTime.UtcNow;
            var activeTrips = await _context
                .Trips.AsNoTracking()
                .Include(t => t.Route)
                    .ThenInclude(r => r!.BusCompany)
                .Include(t => t.Bus)
                .Include(t => t.BusType)
                .Include(t => t.Tickets)
                .Where(t =>
                    t.Status == TripStatus.Running
                    || (
                        t.Status == TripStatus.Scheduled
                        && t.DepartureTime <= now.AddHours(2)
                        && t.DepartureTime >= now
                    )
                )
                .OrderBy(t => t.DepartureTime)
                .Select(t => new TripMonitoringListItemDto
                {
                    TripID = t.TripID,
                    RouteName = t.Route!.RouteName,
                    CompanyName = t.Route!.BusCompany!.Name,
                    BusPlateNumber = t.Bus != null ? t.Bus.PlateNumber : null,
                    DepartureTime = t.DepartureTime,
                    ArrivalTime = t.ArrivalTime,
                    Status = (int)t.Status,
                    TotalSeats = t.BusType!.TotalSeats,
                    BookedSeats = t.Tickets.Count(tk =>
                        tk.Status == TicketStatus.Issued || tk.Status == TicketStatus.CheckedIn
                    ),
                    Revenue = t
                        .Tickets.Where(tk =>
                            tk.Status == TicketStatus.Issued || tk.Status == TicketStatus.CheckedIn
                        )
                        .Sum(tk => tk.FinalPrice),
                })
                .ToListAsync();

            return Ok(activeTrips);
        }
    }

    [Authorize(Roles = "SysAdmin")]
    [Route("api/admin/system/routes")]
    [ApiController]
    public class RoutePerformanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RoutePerformanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("performance")]
        public async Task<IActionResult> GetRoutePerformance(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate
        )
        {
            var query = _context
                .BusRoutes.AsNoTracking()
                .Include(r => r.BusCompany)
                .Include(r => r.Trips)
                    .ThenInclude(t => t.Tickets)
                .Include(r => r.Trips)
                    .ThenInclude(t => t.BusType)
                .AsQueryable();

            var routes = await query.ToListAsync();

            var performance = routes
                .Select(r =>
                {
                    var trips = r.Trips;
                    if (startDate.HasValue)
                        trips = trips.Where(t => t.DepartureTime >= startDate.Value).ToList();
                    if (endDate.HasValue)
                        trips = trips
                            .Where(t => t.DepartureTime <= endDate.Value.AddDays(1))
                            .ToList();

                    var completedTrips = trips.Count(t => t.Status == TripStatus.Completed);
                    var cancelledTrips = trips.Count(t => t.Status == TripStatus.Cancelled);
                    var totalTrips = trips.Count;

                    var averageOccupancy =
                        trips.Count > 0
                            ? trips
                                .Where(t => t.BusType != null && t.BusType.TotalSeats > 0)
                                .Average(t =>
                                    (double)
                                        t.Tickets.Count(tk =>
                                            tk.Status == TicketStatus.Issued
                                            || tk.Status == TicketStatus.CheckedIn
                                        )
                                    / t.BusType!.TotalSeats
                                    * 100
                                )
                            : 0;

                    var revenue = trips.Sum(t =>
                        t.Tickets.Where(tk =>
                                tk.Status == TicketStatus.Issued
                                || tk.Status == TicketStatus.CheckedIn
                            )
                            .Sum(tk => tk.FinalPrice)
                    );

                    return new RoutePerformanceDto
                    {
                        RouteID = r.RouteID,
                        RouteName = r.RouteName,
                        CompanyName = r.BusCompany!.Name,
                        TotalTrips = totalTrips,
                        CompletedTrips = completedTrips,
                        CancelledTrips = cancelledTrips,
                        CompletionRate =
                            totalTrips > 0 ? (double)completedTrips / totalTrips * 100 : 0,
                        AverageOccupancy = averageOccupancy,
                        TotalRevenue = revenue,
                    };
                })
                .OrderByDescending(r => r.TotalRevenue)
                .ToList();

            return Ok(
                new RoutePerformanceListResponseDto
                {
                    Items = performance,
                    TotalCount = performance.Count,
                }
            );
        }
    }
}
