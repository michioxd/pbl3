using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpGet("companies")]
        public async Task<IActionResult> GetCompanies(
            [FromQuery] string? q,
            [FromQuery] List<string>? statuses,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortDirection,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });

            // Parse status filters
            var normalizedStatuses = new HashSet<CompanyStatus>();
            if (statuses != null && statuses.Count > 0)
            {
                foreach (var rawStatus in statuses.SelectMany(s =>
                    s.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)))
                {
                    if (Enum.TryParse<CompanyStatus>(rawStatus, true, out var status))
                        normalizedStatuses.Add(status);
                    else
                        return BadRequest(new { message = "Trạng thái không hợp lệ." });
                }
            }

            var baseQuery = _context.BusCompanies.AsNoTracking();
            var totalCount = await baseQuery.CountAsync();

            // Search filter
            if (!string.IsNullOrWhiteSpace(q))
            {
                var keyword = $"%{q.Trim()}%";
                baseQuery = baseQuery.Where(c =>
                    EF.Functions.ILike(c.Name, keyword) ||
                    (c.LicenseNumber != null && EF.Functions.ILike(c.LicenseNumber, keyword))
                );
            }

            // Status filter
            if (normalizedStatuses.Count > 0)
                baseQuery = baseQuery.Where(c => normalizedStatuses.Contains(c.Status));

            var filteredCount = await baseQuery.CountAsync();
            var totalPages = filteredCount == 0 ? 1 : (int)Math.Ceiling(filteredCount / (double)pageSize);

            // Sorting
            var isDescending = !string.Equals(sortDirection, "asc", StringComparison.OrdinalIgnoreCase);
            baseQuery = (sortBy ?? string.Empty).ToLowerInvariant() switch
            {
                "name" => isDescending ? baseQuery.OrderByDescending(c => c.Name) : baseQuery.OrderBy(c => c.Name),
                "status" => isDescending ? baseQuery.OrderByDescending(c => c.Status) : baseQuery.OrderBy(c => c.Status),
                _ => isDescending ? baseQuery.OrderByDescending(c => c.CreatedAt) : baseQuery.OrderBy(c => c.CreatedAt),
            };

            // Paginate
            var companies = await baseQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new { c.CompanyID, c.Name, c.LicenseNumber, c.Hotline, c.Status, c.IsApproved, c.CreatedAt })
                .ToListAsync();

            var companyIds = companies.Select(c => c.CompanyID).ToList();

            // Aggregate related counts
            var adminsCounts = await _context.BusCompanyAdmins
                .Where(bca => companyIds.Contains(bca.CompanyID))
                .GroupBy(bca => bca.CompanyID)
                .Select(g => new { CompanyID = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CompanyID, x => x.Count);

            var routesCounts = await _context.BusRoutes
                .Where(r => companyIds.Contains(r.CompanyID))
                .GroupBy(r => r.CompanyID)
                .Select(g => new { CompanyID = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CompanyID, x => x.Count);

            var busesCounts = await _context.Buses
                .Where(b => companyIds.Contains(b.CompanyID))
                .GroupBy(b => b.CompanyID)
                .Select(g => new { CompanyID = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CompanyID, x => x.Count);

            var blockedDeleteIds = new HashSet<Guid>(routesCounts.Keys);
            blockedDeleteIds.UnionWith(busesCounts.Keys);

            // Map to DTOs
            var items = companies.Select(c => new AdminCompanyListItemDto
            {
                CompanyID = c.CompanyID,
                Name = c.Name,
                LicenseNumber = c.LicenseNumber,
                Hotline = c.Hotline,
                Status = (int)c.Status,
                IsApproved = c.IsApproved,
                CreatedAt = c.CreatedAt,
                AdminsCount = adminsCounts.GetValueOrDefault(c.CompanyID),
                RoutesCount = routesCounts.GetValueOrDefault(c.CompanyID),
                BusesCount = busesCounts.GetValueOrDefault(c.CompanyID),
                ActiveTripsCount = 0,
                CanBeDeleted = !blockedDeleteIds.Contains(c.CompanyID),
            }).ToList();

            // Summary
            var allStatuses = await _context.BusCompanies.AsNoTracking()
                .Select(c => c.Status)
                .ToListAsync();

            var summary = new AdminCompanySummaryDto
            {
                TotalCompanies = allStatuses.Count,
                PendingCompanies = allStatuses.Count(s => s == CompanyStatus.Pending),
                ApprovedCompanies = allStatuses.Count(s => s == CompanyStatus.Approved),
                SuspendedCompanies = allStatuses.Count(s => s == CompanyStatus.Suspended),
                RejectedCompanies = allStatuses.Count(s => s == CompanyStatus.Rejected),
            };

            return Ok(new AdminCompaniesListResponseDto
            {
                Items = items,
                TotalCount = totalCount,
                FilteredCount = filteredCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                Summary = summary,
            });
        }

        [HttpGet("companies/stats")]
        public async Task<IActionResult> GetCompanyStats()
        {
            var allStatuses = await _context.BusCompanies.AsNoTracking()
                .Select(c => c.Status)
                .ToListAsync();

            return Ok(new AdminCompanySummaryDto
            {
                TotalCompanies = allStatuses.Count,
                PendingCompanies = allStatuses.Count(s => s == CompanyStatus.Pending),
                ApprovedCompanies = allStatuses.Count(s => s == CompanyStatus.Approved),
                SuspendedCompanies = allStatuses.Count(s => s == CompanyStatus.Suspended),
                RejectedCompanies = allStatuses.Count(s => s == CompanyStatus.Rejected),
            });
        }

        [HttpGet("companies/{companyId:guid}/profile")]
        public async Task<IActionResult> GetCompanyProfile(Guid companyId)
        {
            var company = await _context
                .BusCompanies.AsNoTracking()
                .Where(c => c.CompanyID == companyId)
                .Select(c => new
                {
                    c.CompanyID,
                    c.Name,
                    c.LicenseNumber,
                    c.Hotline,
                    c.IsApproved,
                })
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            return Ok(company);
        }

        [HttpGet("companies/{companyId:guid}/buses")]
        public async Task<IActionResult> GetCompanyBuses(Guid companyId)
        {
            var companyExists = await _context.BusCompanies.AnyAsync(c => c.CompanyID == companyId);
            if (!companyExists)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            var buses = await _context
                .Buses.AsNoTracking()
                .Include(b => b.BusType)
                .Where(b => b.CompanyID == companyId)
                .Select(b => new
                {
                    b.BusID,
                    b.PlateNumber,
                    b.IsActive,
                    b.CompanyID,
                    BusType = b.BusType == null
                        ? null
                        : new
                        {
                            b.BusType.BusTypeID,
                            b.BusType.Name,
                            b.BusType.TotalSeats,
                            Amenities = b.BusType.Description,
                        },
                })
                .ToListAsync();

            return Ok(buses);
        }

        [HttpGet("companies/{companyId:guid}/routes")]
        public async Task<IActionResult> GetCompanyRoutes(Guid companyId)
        {
            var companyExists = await _context.BusCompanies.AnyAsync(c => c.CompanyID == companyId);
            if (!companyExists)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            var routes = await _context
                .BusRoutes.AsNoTracking()
                .Where(r => r.CompanyID == companyId)
                .Select(r => new
                {
                    r.RouteID,
                    r.RouteName,
                    r.DepartureProvinceCode,
                    r.ArrivalProvinceCode,
                    Distance = r.DistanceEstimate,
                    Duration = r.DurationEstimate,
                    r.IsActive,
                    TripsCount = _context.Trips.Count(t => t.RouteID == r.RouteID),
                })
                .OrderBy(r => r.RouteName)
                .ToListAsync();

            return Ok(routes);
        }

        [HttpGet("companies/{companyId:guid}/analytics")]
        public async Task<IActionResult> GetCompanyAnalytics(
            Guid companyId,
            [FromQuery] int? year,
            [FromQuery] int? month
        )
        {
            var companyExists = await _context.BusCompanies.AnyAsync(c => c.CompanyID == companyId);
            if (!companyExists)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            var currentYear = year ?? DateTime.UtcNow.Year;
            var currentMonth = month;

            var tripsQuery = _context
                .Trips.AsNoTracking()
                .Include(t => t.Route)
                .Where(t => t.Route!.CompanyID == companyId);

            if (currentMonth.HasValue)
            {
                tripsQuery = tripsQuery.Where(
                    t =>
                        t.DepartureTime.Year == currentYear
                        && t.DepartureTime.Month == currentMonth.Value
                );
            }
            else
            {
                tripsQuery = tripsQuery.Where(t => t.DepartureTime.Year == currentYear);
            }

            var trips = await tripsQuery.ToListAsync();

            var tripIds = trips.Select(t => t.TripID).ToHashSet();
            var tickets = await _context
                .Tickets.AsNoTracking()
                .Include(tk => tk.Booking)
                .Where(tk => tripIds.Contains(tk.TripID))
                .Where(tk => tk.Status == TicketStatus.Issued || tk.Status == TicketStatus.CheckedIn)
                .ToListAsync();

            var totalRevenue = tickets.Sum(tk => tk.FinalPrice);
            var totalTicketsSold = tickets.Count;
            var totalTrips = trips.Count;
            var completedTrips = trips.Count(t => t.DepartureTime < DateTime.UtcNow);

            var monthlyRevenue = tickets
                .Where(tk => tk.Booking != null)
                .GroupBy(tk => tk.Booking!.CreatedAt.Month)
                .Select(g => new { Month = g.Key, Revenue = g.Sum(tk => tk.FinalPrice) })
                .OrderBy(x => x.Month)
                .ToList();

            return Ok(
                new
                {
                    totalRevenue,
                    totalTicketsSold,
                    totalTrips,
                    completedTrips,
                    year = currentYear,
                    month = currentMonth,
                    monthlyRevenue,
                }
            );
        }

        [HttpGet("companies/{companyId:guid}/tickets")]
        public async Task<IActionResult> GetBookedTickets(
            Guid companyId,
            [FromQuery] TicketStatus? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var companyExists = await _context.BusCompanies.AnyAsync(c => c.CompanyID == companyId);
            if (!companyExists)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            var query = _context
                .Tickets.AsNoTracking()
                .Where(t =>
                    t.Trip != null && t.Trip.Route != null && t.Trip.Route.CompanyID == companyId
                );

            if (status.HasValue)
            {
                query = query.Where(t => t.Status == status.Value);
            }

            var totalRecords = await query.CountAsync();
            var totalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

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

        [HttpGet("companies/{companyId:guid}/trips")]
        public async Task<IActionResult> GetTrips(
            Guid companyId,
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

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var companyExists = await _context.BusCompanies.AnyAsync(c => c.CompanyID == companyId);
            if (!companyExists)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            var query = _context
                .Trips.AsNoTracking()
                .Where(t => t.Route != null && t.Route.CompanyID == companyId);

            if (year.HasValue && month.HasValue && month >= 1 && month <= 12)
            {
                var start = new DateOnly(year.Value, month.Value, 1);
                var end = start.AddMonths(1);
                query = query.Where(t => t.DepartureDate >= start && t.DepartureDate < end);
            }

            var totalRecords = await query.CountAsync();
            var totalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

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
        public async Task<IActionResult> GetSeatLayouts(Guid busTypeId)
        {
            var busTypeExists = await IsBusTypeExistsAsync(busTypeId);
            if (!busTypeExists)
                return NotFound(new { message = "Không tìm thấy loại xe." });

            var layouts = await _context
                .SeatLayouts.AsNoTracking()
                .Where(s => s.BusTypeID == busTypeId)
                .OrderBy(s => s.Floor)
                .ThenBy(s => s.PositionY)
                .ThenBy(s => s.PositionX)
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

            return Ok(layouts);
        }

        [HttpGet("bus-types/{busTypeId:guid}/amenities")]
        public async Task<IActionResult> GetBusTypeAmenities(Guid busTypeId)
        {
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

        [HttpGet("users/{userId:guid}")]
        public async Task<IActionResult> GetUserDetails(Guid userId)
        {
            var passenger = await _context
                .Passengers.AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserID == userId);

            var user = await _context
                .Users.AsNoTracking()
                .Include(u => u.Role)
                .Where(u => u.UserID == userId)
                .Select(u => new
                {
                    u.UserID,
                    u.Email,
                    u.FullName,
                    u.PhoneNumber,
                    u.IsActive,
                    u.CreatedAt,
                    role = u.Role == null ? null : new { u.Role.RoleID, u.Role.RoleName },
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            return Ok(
                new
                {
                    passenger = passenger == null
                        ? null
                        : new
                        {
                            passenger.PassengerID,
                            passenger.FullName,
                            passenger.Email,
                            passenger.PhoneNumber,
                        },
                    user,
                }
            );
        }

        [HttpGet("users/{userId:guid}/tickets")]
        public async Task<IActionResult> GetUserTickets(Guid userId)
        {
            var passenger = await _context
                .Passengers.AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserID == userId);
            if (passenger == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ hành khách." });

            var tickets = await _context
                .Tickets.AsNoTracking()
                .Include(t => t.Trip)
                    .ThenInclude(tr => tr!.Route)
                .Include(t => t.SeatLayout)
                .Where(t => t.PassengerID == passenger.PassengerID)
                .Select(t => new
                {
                    t.TicketID,
                    SeatLabel = t.SeatLayout != null ? t.SeatLayout.SeatLabel : null,
                    Price = t.FinalPrice,
                    t.Status,
                    RouteName = t.Trip != null && t.Trip.Route != null
                        ? t.Trip.Route.RouteName
                        : null,
                    DepartureTime = t.Trip != null ? t.Trip.DepartureTime : default,
                })
                .ToListAsync();

            return Ok(tickets);
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

            var startDate = new DateOnly(year, month, 1);
            var endDate = startDate.AddMonths(1);

            var ticketsQuery = _context
                .Tickets.AsNoTracking()
                .Where(t =>
                    t.Trip != null
                    && t.Trip.DepartureDate >= startDate
                    && t.Trip.DepartureDate < endDate
                );

            var totalTickets = await ticketsQuery.CountAsync();
            var soldTickets = await ticketsQuery.CountAsync(t =>
                t.Status != TicketStatus.Cancelled
            );
            var cancelledTickets = await ticketsQuery.CountAsync(t =>
                t.Status == TicketStatus.Cancelled
            );
            var checkedInTickets = await ticketsQuery.CountAsync(t =>
                t.Status == TicketStatus.CheckedIn
            );

            var grossRevenue =
                await ticketsQuery
                    .Where(t => t.Status != TicketStatus.Cancelled)
                    .SumAsync(t => (decimal?)t.FinalPrice)
                ?? 0m;

            var avgTicketPrice = soldTickets == 0 ? 0m : grossRevenue / soldTickets;

            var totalTripsInMonth = await _context
                .Trips.AsNoTracking()
                .Where(tr => tr.DepartureDate >= startDate && tr.DepartureDate < endDate)
                .CountAsync();

            var topRoutes = await ticketsQuery
                .Where(t =>
                    t.Status != TicketStatus.Cancelled && t.Trip != null && t.Trip.Route != null
                )
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
                    SoldTickets = g.Count(x => x.Status != TicketStatus.Cancelled),
                    CancelledTickets = g.Count(x => x.Status == TicketStatus.Cancelled),
                    Revenue = g.Where(x => x.Status != TicketStatus.Cancelled)
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
