using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Models;

namespace Pbl3.Services.BusAdmin
{
    public partial class BusAdminBusesService
    {
        public async Task CreateBusAsync(Guid companyId, CreateBusDto dto)
        {
            await EnsureCompanyAccessAsync(companyId);

            var isBusTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!isBusTypeExists)
                throw new ArgumentException("Loại xe không tồn tại.");

            var newBus = new Bus
            {
                BusID = Guid.NewGuid(),
                CompanyID = companyId,
                BusTypeID = dto.BusTypeID,
                PlateNumber = dto.PlateNumber,
                IsActive = dto.IsActive,
            };

            _context.Buses.Add(newBus);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteBusAsync(Guid id, Guid companyId)
        {
            await EnsureCompanyAccessAsync(companyId);

            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == id);
            if (bus == null)
                throw new KeyNotFoundException("Không tìm thấy xe.");

            if (bus.CompanyID != companyId)
                throw new InvalidOperationException("Không có quyền truy cập.");

            var hasTripsUsingBus = await _context.Trips.AnyAsync(t => t.BusID == id);
            if (hasTripsUsingBus)
                throw new ArgumentException("Xe đã được gán cho chuyến xe, không thể xóa.");

            if (bus.IsActive)
                throw new ArgumentException("Xe đang hoạt động, không thể xóa.");

            _context.Buses.Remove(bus);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Guid>> CreateTripAsync(Guid companyId, CreateTripDto dto)
        {
            await EnsureCompanyAccessAsync(companyId);

            var isRouteOwned = await IsRouteOwnedByCompanyAsync(companyId, dto.RouteID);
            if (!isRouteOwned)
                throw new ArgumentException("Tuyến đường không thuộc nhà xe của bạn.");

            if (dto.BusID.HasValue)
            {
                var isBusOwned = await IsBusOwnedByCompanyAsync(companyId, dto.BusID.Value);
                if (!isBusOwned)
                    throw new ArgumentException("Xe không thuộc nhà xe của bạn.");
            }

            var isBusTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!isBusTypeExists)
                throw new ArgumentException("Loại xe không tồn tại.");

            var departureDates = (
                dto.DepartureDates != null && dto.DepartureDates.Count > 0
                    ? dto.DepartureDates
                    : [dto.DepartureDate]
            )
                .Distinct()
                .OrderBy(date => date)
                .ToList();

            var today = DateOnly.FromDateTime(DateTime.Today);
            if (departureDates.Any(date => date < today))
                throw new ArgumentException("Ngày khởi hành phải từ hôm nay trở đi.");

            var trips = departureDates
                .Select(departureDate => new Trip
                {
                    TripID = Guid.NewGuid(),
                    RouteID = dto.RouteID,
                    BusID = dto.BusID,
                    BusTypeID = dto.BusTypeID,
                    DepartureDate = departureDate,
                    DepartureTime = dto.DepartureTime,
                    ArrivalTime = dto.ArrivalTime,
                    Status = dto.Status,
                })
                .ToList();

            _context.Trips.AddRange(trips);
            await _context.SaveChangesAsync();

            return trips.Select(trip => trip.TripID).ToList();
        }

        public async Task DeleteTripAsync(Guid tripId, Guid companyId)
        {
            await EnsureCompanyAccessAsync(companyId);

            var trip = await _context
                .Trips.Include(t => t.Tickets)
                .FirstOrDefaultAsync(t => t.TripID == tripId);

            if (trip == null)
                throw new KeyNotFoundException("Không tìm thấy chuyến xe.");

            var isTripOwned = await IsTripOwnedByCompanyAsync(companyId, tripId);
            if (!isTripOwned)
                throw new InvalidOperationException("Không có quyền truy cập.");

            if (trip.Tickets.Any())
                throw new ArgumentException("Chuyến xe đã có vé, không thể xóa.");

            _context.Trips.Remove(trip);
            await _context.SaveChangesAsync();
        }

        public async Task<Guid> CreateSeatLayoutAsync(Guid busTypeId, CreateSeatLayoutDto dto, Guid companyId)
        {
            await EnsureCompanyAccessAsync(companyId);

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId, busTypeId);
            if (!hasOwnership)
                throw new InvalidOperationException("Không có quyền truy cập.");

            var seatLayout = new SeatLayout
            {
                LayoutID = Guid.NewGuid(),
                BusTypeID = busTypeId,
                SeatLabel = dto.SeatLabel,
                Floor = dto.Floor,
                SeatType = dto.SeatType,
                PositionX = dto.PositionX,
                PositionY = dto.PositionY,
            };

            _context.SeatLayouts.Add(seatLayout);
            await _context.SaveChangesAsync();

            return seatLayout.LayoutID;
        }

        public async Task DeleteSeatLayoutAsync(Guid layoutId, Guid companyId)
        {
            await EnsureCompanyAccessAsync(companyId);

            var seatLayout = await _context.SeatLayouts.FirstOrDefaultAsync(s =>
                s.LayoutID == layoutId
            );
            if (seatLayout == null)
                throw new KeyNotFoundException("Không tìm thấy sơ đồ ghế.");

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(
                companyId,
                seatLayout.BusTypeID
            );
            if (!hasOwnership)
                throw new InvalidOperationException("Không có quyền truy cập.");

            _context.SeatLayouts.Remove(seatLayout);
            await _context.SaveChangesAsync();
        }
    }
}
