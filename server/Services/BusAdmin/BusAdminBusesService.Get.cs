using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Enums;

namespace Pbl3.Services.BusAdmin
{
    public partial class BusAdminBusesService
    {
        public async Task<object> GetCompanyBusesAsync(Guid companyId, int page, int pageSize)
        {
            if (page < 1)
                throw new ArgumentException("page phải lớn hơn hoặc bằng 1.");

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
                throw new ArgumentException("pageSize chỉ chấp nhận: 25, 50, 100, 200.");

            await EnsureCompanyAccessAsync(companyId);

            var query = _context
                .Buses.AsNoTracking()
                .Include(b => b.BusType)
                .Where(b => b.CompanyID == companyId);

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

            return new
            {
                page,
                pageSize,
                totalRecords,
                totalPages,
                records = buses,
            };
        }

        public async Task<object> GetBookedTicketsAsync(Guid companyId, TicketStatus? status, int page, int pageSize)
        {
            if (page < 1)
                throw new ArgumentException("page phải lớn hơn hoặc bằng 1.");

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
                throw new ArgumentException("pageSize chỉ chấp nhận: 25, 50, 100, 200.");

            await EnsureCompanyAccessAsync(companyId);

            var query = _context
                .Tickets.AsNoTracking()
                .Where(t =>
                    t.Trip != null
                    && t.Trip.Route != null
                    && t.Trip.Route.CompanyID == companyId
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

            return new
            {
                page,
                pageSize,
                totalRecords,
                totalPages,
                records = tickets,
            };
        }

        public async Task<object> GetTripsAsync(Guid companyId, int? year, int? month, int page, int pageSize)
        {
            if (page < 1)
                throw new ArgumentException("page phải lớn hơn hoặc bằng 1.");

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
                throw new ArgumentException("pageSize chỉ chấp nhận: 25, 50, 100, 200.");

            await EnsureCompanyAccessAsync(companyId);

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

            return new
            {
                page,
                pageSize,
                totalRecords,
                totalPages,
                records = trips,
            };
        }

        public async Task<object> GetSeatLayoutsAsync(Guid busTypeId, Guid companyId, int page, int pageSize)
        {
            if (page < 1)
                throw new ArgumentException("page phải lớn hơn hoặc bằng 1.");

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
                throw new ArgumentException("pageSize chỉ chấp nhận: 25, 50, 100, 200.");

            await EnsureCompanyAccessAsync(companyId);

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId, busTypeId);
            if (!hasOwnership)
                throw new InvalidOperationException("Không có quyền truy cập.");

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

            return new
            {
                page,
                pageSize,
                totalRecords,
                totalPages,
                records = layouts,
            };
        }

        public async Task<object> GetBusTypeAmenitiesAsync(Guid busTypeId, Guid companyId)
        {
            await EnsureCompanyAccessAsync(companyId);

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId, busTypeId);
            if (!hasOwnership)
                throw new InvalidOperationException("Không có quyền truy cập.");

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
                throw new KeyNotFoundException("Không tìm thấy loại xe.");

            return new
            {
                busType.BusTypeID,
                busType.Name,
                Amenities = busType.Description,
            };
        }

        public async Task<object> GetMonthlyTicketStatsAsync(Guid companyId, int year, int month)
        {
            if (year < 2000 || year > 3000)
                throw new ArgumentException("Year không hợp lệ.");

            if (month < 1 || month > 12)
                throw new ArgumentException("Month phải từ 1 đến 12.");

            await EnsureCompanyAccessAsync(companyId);

            var startDate = new DateOnly(year, month, 1);
            var endDate = startDate.AddMonths(1);

            var ticketsQuery = _context
                .Tickets.AsNoTracking()
                .Where(t =>
                    t.Trip != null
                    && t.Trip.Route != null
                    && t.Trip.Route.CompanyID == companyId
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
                    && tr.Route.CompanyID == companyId
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

            return new
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
            };
        }
    }
}
