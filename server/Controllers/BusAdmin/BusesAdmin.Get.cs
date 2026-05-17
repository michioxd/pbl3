using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Enums;

namespace Pbl3.Controllers.BusAdmin
{
    public partial class BusesController
    {
        [HttpGet("company")]
        public async Task<IActionResult> GetCompanyBuses(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (!IsValidPageSize(pageSize))
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var query = _context
                .Buses.AsNoTracking()
                .Include(b => b.BusType)
                .Where(b => b.CompanyID == companyId.Value);

            var totalRecords = await query.CountAsync();
            var totalPages =
                totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

            var buses = await query
                .OrderBy(b => b.PlateNumber)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new
                {
                    b.BusID,
                    b.PlateNumber,
                    b.IsActive,
                    BusType = new
                    {
                        b.BusType!.BusTypeID,
                        b.BusType.Name,
                        b.BusType.TotalSeats,
                        Amenities = b.BusType.Description,
                    },
                })
                .ToListAsync();

            return Ok(
                new
                {
                    page,
                    pageSize,
                    totalRecords,
                    totalPages,
                    records = buses,
                }
            );
        }

        [HttpGet("company/profile")]
        public async Task<IActionResult> GetCompanyProfile()
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var company = await _context
                .BusCompanies.AsNoTracking()
                .Where(c => c.CompanyID == companyId.Value)
                .Select(c => new
                {
                    c.CompanyID,
                    c.Name,
                    c.LicenseNumber,
                    c.Hotline,
                    c.AllowPayOnBoard,
                    c.IsApproved,
                })
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            return Ok(company);
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetBookedTickets(
            [FromQuery] TicketStatus? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (!IsValidPageSize(pageSize))
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var query = _context
                .Tickets.AsNoTracking()
                .Where(t =>
                    t.Trip != null
                    && t.Trip.Route != null
                    && t.Trip.Route.CompanyID == companyId.Value
                );

            if (status.HasValue)
            {
                query = query.Where(t => t.Status == status.Value);
            }

            var totalRecords = await query.CountAsync();
            var totalPages =
                totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

            var tickets = await query
                .OrderByDescending(t => t.Booking!.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.TicketID,
                    t.TicketCode,
                    t.FinalPrice,
                    t.Status,
                    BookingTime = t.Booking!.CreatedAt,
                    Passenger = new
                    {
                        t.Passenger!.PassengerID,
                        t.Passenger.FullName,
                        t.Passenger.PhoneNumber,
                        t.Passenger.Email,
                    },
                    Trip = new
                    {
                        t.Trip!.TripID,
                        t.Trip.DepartureDate,
                        t.Trip.DepartureTime,
                        t.Trip.ArrivalTime,
                        RouteName = t.Trip.Route!.RouteName,
                    },
                    Seat = new
                    {
                        t.SeatLayout!.LayoutID,
                        t.SeatLayout.SeatLabel,
                        t.SeatLayout.Floor,
                    },
                })
                .ToListAsync();

            return Ok(
                new
                {
                    page,
                    pageSize,
                    totalRecords,
                    totalPages,
                    records = tickets,
                }
            );
        }

        [HttpGet("trips")]
        public async Task<IActionResult> GetTrips(
            [FromQuery] int? year,
            [FromQuery] int? month,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (!IsValidPageSize(pageSize))
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var query = _context
                .Trips.AsNoTracking()
                .Where(t => t.Route != null && t.Route.CompanyID == companyId.Value);

            if (year.HasValue && month.HasValue && month >= 1 && month <= 12)
            {
                var start = new DateOnly(year.Value, month.Value, 1);
                var end = start.AddMonths(1);
                query = query.Where(t => t.DepartureDate >= start && t.DepartureDate < end);
            }

            var totalRecords = await query.CountAsync();
            var totalPages =
                totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

            var trips = await query
                .OrderByDescending(t => t.DepartureDate)
                .ThenByDescending(t => t.DepartureTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.TripID,
                    t.DepartureDate,
                    t.DepartureTime,
                    t.ArrivalTime,
                    t.Status,
                    t.RouteID,
                    RouteName = t.Route!.RouteName,
                    t.BusID,
                    BusPlateNumber = t.Bus != null ? t.Bus.PlateNumber : null,
                    t.BusTypeID,
                    BusTypeName = t.BusType != null ? t.BusType.Name : null,
                    TicketCount = t.Tickets.Count,
                })
                .ToListAsync();

            return Ok(
                new
                {
                    page,
                    pageSize,
                    totalRecords,
                    totalPages,
                    records = trips,
                }
            );
        }

        [HttpGet("bus-types/{busTypeId:guid}/seat-layouts")]
        public async Task<IActionResult> GetSeatLayouts(
            Guid busTypeId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (!IsValidPageSize(pageSize))
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId.Value, busTypeId);
            if (!hasOwnership)
                return Forbid();

            var query = _context.SeatLayouts.AsNoTracking().Where(s => s.BusTypeID == busTypeId);

            var totalRecords = await query.CountAsync();
            var totalPages =
                totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

            var layouts = await query
                .OrderBy(s => s.Floor)
                .ThenBy(s => s.PositionY)
                .ThenBy(s => s.PositionX)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new
                {
                    s.LayoutID,
                    s.BusTypeID,
                    s.SeatLabel,
                    s.Floor,
                    s.SeatType,
                    s.PositionX,
                    s.PositionY,
                })
                .ToListAsync();

            return Ok(
                new
                {
                    page,
                    pageSize,
                    totalRecords,
                    totalPages,
                    records = layouts,
                }
            );
        }

        [HttpGet("bus-types/{busTypeId:guid}/amenities")]
        public async Task<IActionResult> GetBusTypeAmenities(Guid busTypeId)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId.Value, busTypeId);
            if (!hasOwnership)
                return Forbid();

            var busType = await _context
                .BusTypes.AsNoTracking()
                .Where(b => b.BusTypeID == busTypeId)
                .Select(b => new
                {
                    b.BusTypeID,
                    b.Name,
                    b.Description,
                })
                .FirstOrDefaultAsync();

            if (busType == null)
                return NotFound(new { message = "Không tìm thấy loại xe." });

            return Ok(
                new
                {
                    busType.BusTypeID,
                    busType.Name,
                    Amenities = busType.Description,
                }
            );
        }

        [HttpGet("stats/monthly")]
        public async Task<IActionResult> GetMonthlyTicketStats(
            [FromQuery] int year,
            [FromQuery] int month
        )
        {
            if (year < 2000 || year > 3000)
                return BadRequest(new { message = "Year không hợp lệ." });

            if (month < 1 || month > 12)
                return BadRequest(new { message = "Month phải từ 1 đến 12." });

            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var startDate = new DateOnly(year, month, 1);
            var endDate = startDate.AddMonths(1);

            var ticketsQuery = _context
                .Tickets.AsNoTracking()
                .Where(t =>
                    t.Trip != null
                    && t.Trip.Route != null
                    && t.Trip.Route.CompanyID == companyId.Value
                    && t.Trip.DepartureDate >= startDate
                    && t.Trip.DepartureDate < endDate
                );

            var totalTickets = await ticketsQuery.CountAsync();
            var soldTickets = await ticketsQuery.CountAsync(t => t.Status == TicketStatus.Issued);
            var cancelledTickets = await ticketsQuery.CountAsync(t =>
                t.Status == TicketStatus.Cancelled
            );
            var checkedInTickets = await ticketsQuery.CountAsync(t =>
                t.Status == TicketStatus.CheckedIn
            );

            var grossRevenue =
                await ticketsQuery
                    .Where(t =>
                        t.Status == TicketStatus.Issued || t.Status == TicketStatus.CheckedIn
                    )
                    .SumAsync(t => (decimal?)t.FinalPrice)
                ?? 0m;

            var avgTicketPrice = soldTickets == 0 ? 0m : grossRevenue / soldTickets;

            var totalTripsInMonth = await _context
                .Trips.AsNoTracking()
                .Where(tr =>
                    tr.Route != null
                    && tr.Route.CompanyID == companyId.Value
                    && tr.DepartureDate >= startDate
                    && tr.DepartureDate < endDate
                )
                .CountAsync();

            var topRoutes = await ticketsQuery
                .Where(t => t.Status == TicketStatus.Issued || t.Status == TicketStatus.CheckedIn)
                .GroupBy(t => t.Trip!.Route!.RouteName)
                .Select(g => new
                {
                    RouteName = g.Key,
                    TicketsSold = g.Count(),
                    Revenue = g.Sum(x => x.FinalPrice),
                })
                .OrderByDescending(x => x.TicketsSold)
                .ThenByDescending(x => x.Revenue)
                .Take(5)
                .ToListAsync();

            var dailyStats = await ticketsQuery
                .GroupBy(t => t.Trip!.DepartureDate)
                .Select(g => new
                {
                    Date = g.Key,
                    TotalTickets = g.Count(),
                    SoldTickets = g.Count(x =>
                        x.Status == TicketStatus.Issued || x.Status == TicketStatus.CheckedIn
                    ),
                    CancelledTickets = g.Count(x => x.Status == TicketStatus.Cancelled),
                    Revenue = g.Where(x =>
                            x.Status == TicketStatus.Issued || x.Status == TicketStatus.CheckedIn
                        )
                        .Sum(x => x.FinalPrice),
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var cancellationRate =
                totalTickets == 0
                    ? 0m
                    : Math.Round((decimal)cancelledTickets * 100m / totalTickets, 2);
            var avgSoldTicketsPerTrip =
                totalTripsInMonth == 0
                    ? 0m
                    : Math.Round((decimal)soldTickets / totalTripsInMonth, 2);

            return Ok(
                new
                {
                    Year = year,
                    Month = month,
                    TotalTickets = totalTickets,
                    SoldTickets = soldTickets,
                    CancelledTickets = cancelledTickets,
                    CheckedInTickets = checkedInTickets,
                    CancellationRatePercent = cancellationRate,
                    GrossRevenue = grossRevenue,
                    AverageTicketPrice = Math.Round(avgTicketPrice, 2),
                    TotalTrips = totalTripsInMonth,
                    AverageSoldTicketsPerTrip = avgSoldTicketsPerTrip,
                    TopRoutes = topRoutes,
                    DailyStats = dailyStats,
                }
            );
        }
    }
}
