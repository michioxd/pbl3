using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Models;

namespace Pbl3.Services.Admin
{
    public partial class SystemAdminManagementService
    {
        public async Task<Guid> CreateBusAsync(Guid companyId, CreateBusDto dto)
        {
            var companyExists = await _context.BusCompanies.AnyAsync(c => c.CompanyID == companyId);
            if (!companyExists)
                throw new KeyNotFoundException("Không tìm thấy nhà xe.");

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

            return newBus.BusID;
        }

        public async Task DeleteBusAsync(Guid id)
        {
            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == id);
            if (bus == null)
                throw new KeyNotFoundException("Không tìm thấy xe.");

            var hasTripsUsingBus = await _context.Trips.AnyAsync(t => t.BusID == id);
            if (hasTripsUsingBus)
                throw new ArgumentException("Xe đã được gán cho chuyến xe, không thể xóa.");

            if (bus.IsActive)
                throw new ArgumentException("Xe đang hoạt động, không thể xóa.");

            _context.Buses.Remove(bus);
            await _context.SaveChangesAsync();
        }

        public async Task<Guid> CreateTripAsync(Guid companyId, CreateTripDto dto)
        {
            var companyExists = await _context.BusCompanies.AnyAsync(c => c.CompanyID == companyId);
            if (!companyExists)
                throw new KeyNotFoundException("Không tìm thấy nhà xe.");

            var isRouteOwned = await IsRouteOwnedByCompanyAsync(companyId, dto.RouteID);
            if (!isRouteOwned)
                throw new ArgumentException("Tuyến đường không thuộc nhà xe đã chọn.");

            if (dto.BusID.HasValue)
            {
                var isBusOwned = await IsBusOwnedByCompanyAsync(companyId, dto.BusID.Value);
                if (!isBusOwned)
                    throw new ArgumentException("Xe không thuộc nhà xe đã chọn.");
            }

            var isBusTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!isBusTypeExists)
                throw new ArgumentException("Loại xe không tồn tại.");

            var trip = new Trip
            {
                TripID = Guid.NewGuid(),
                RouteID = dto.RouteID,
                BusID = dto.BusID,
                BusTypeID = dto.BusTypeID,
                DepartureDate = dto.DepartureDate,
                DepartureTime = dto.DepartureTime,
                ArrivalTime = dto.ArrivalTime,
                Status = dto.Status,
            };

            _context.Trips.Add(trip);
            await _context.SaveChangesAsync();

            return trip.TripID;
        }

        public async Task DeleteTripAsync(Guid tripId)
        {
            var trip = await _context
                .Trips.Include(t => t.Tickets)
                .FirstOrDefaultAsync(t => t.TripID == tripId);

            if (trip == null)
                throw new KeyNotFoundException("Không tìm thấy chuyến xe.");

            if (trip.Tickets.Any())
                throw new ArgumentException("Chuyến xe đã có vé, không thể xóa.");

            _context.Trips.Remove(trip);
            await _context.SaveChangesAsync();
        }

        public async Task<Guid> CreateSeatLayoutAsync(Guid busTypeId, CreateSeatLayoutDto dto)
        {
            var busTypeExists = await IsBusTypeExistsAsync(busTypeId);
            if (!busTypeExists)
                throw new KeyNotFoundException("Không tìm thấy loại xe.");

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

        public async Task DeleteSeatLayoutAsync(Guid layoutId)
        {
            var seatLayout = await _context.SeatLayouts.FirstOrDefaultAsync(s =>
                s.LayoutID == layoutId
            );
            if (seatLayout == null)
                throw new KeyNotFoundException("Không tìm thấy sơ đồ ghế.");

            _context.SeatLayouts.Remove(seatLayout);
            await _context.SaveChangesAsync();
        }
    }
}
