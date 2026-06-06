using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;

namespace Pbl3.Services.BusAdmin
{
    public partial class BusAdminBusesService
    {
        public async Task UpdateBusAsync(Guid id, UpdateBusDto dto, Guid companyId)
        {
            await EnsureCompanyAccessAsync(companyId);

            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == id);
            if (bus == null)
                throw new KeyNotFoundException("Không tìm thấy xe.");

            if (bus.CompanyID != companyId)
                throw new InvalidOperationException("Không có quyền truy cập.");

            var busTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!busTypeExists)
                throw new ArgumentException("Loại xe không tồn tại.");

            bus.PlateNumber = dto.PlateNumber;
            bus.IsActive = dto.IsActive;
            bus.BusTypeID = dto.BusTypeID;

            await _context.SaveChangesAsync();
        }

        public async Task UpdateTripAsync(Guid tripId, UpdateTripDto dto, Guid companyId)
        {
            await EnsureCompanyAccessAsync(companyId);

            var trip = await _context.Trips.FirstOrDefaultAsync(t => t.TripID == tripId);
            if (trip == null)
                throw new KeyNotFoundException("Không tìm thấy chuyến xe.");

            var isTripOwned = await IsTripOwnedByCompanyAsync(companyId, tripId);
            if (!isTripOwned)
                throw new InvalidOperationException("Không có quyền truy cập.");

            var isRouteOwned = await IsRouteOwnedByCompanyAsync(companyId, dto.RouteID);
            if (!isRouteOwned)
                throw new ArgumentException("Tuyến đường không thuộc nhà xe của bạn.");

            if (dto.BusID.HasValue)
            {
                var isBusOwned = await IsBusOwnedByCompanyAsync(companyId, dto.BusID.Value);
                if (!isBusOwned)
                    throw new ArgumentException("Xe không thuộc nhà xe của bạn.");
            }

            if (dto.DepartureDate < DateOnly.FromDateTime(DateTime.Today))
                throw new ArgumentException("Ngày khởi hành phải từ hôm nay trở đi.");

            var parsedDepTime = TimeOnly.Parse(dto.DepartureTime);
            var parsedArrTime = TimeOnly.Parse(dto.ArrivalTime);
            var departureDateTime = dto.DepartureDate.ToDateTime(parsedDepTime);
            var arrivalDateTime = dto.DepartureDate.ToDateTime(parsedArrTime);
            if (arrivalDateTime < departureDateTime)
            {
                arrivalDateTime = arrivalDateTime.AddDays(1);
            }

            trip.RouteID = dto.RouteID;
            trip.BusID = dto.BusID;
            trip.BusTypeID = dto.BusTypeID;
            trip.DepartureDate = dto.DepartureDate;
            trip.DepartureTime = departureDateTime;
            trip.ArrivalTime = arrivalDateTime;
            trip.Status = dto.Status;

            await _context.SaveChangesAsync();
        }

        public async Task UpdateBusTypeAmenitiesAsync(Guid busTypeId, UpdateBusTypeAmenitiesDto dto, Guid companyId)
        {
            await EnsureCompanyAccessAsync(companyId);

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId, busTypeId);
            if (!hasOwnership)
                throw new InvalidOperationException("Không có quyền truy cập.");

            var busType = await _context.BusTypes.FirstOrDefaultAsync(b =>
                b.BusTypeID == busTypeId
            );
            if (busType == null)
                throw new KeyNotFoundException("Không tìm thấy loại xe.");

            busType.Description = dto.Amenities;
            await _context.SaveChangesAsync();
        }

        public async Task UpdateSeatLayoutAsync(Guid layoutId, UpdateSeatLayoutDto dto, Guid companyId)
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

            seatLayout.SeatLabel = dto.SeatLabel;
            seatLayout.Floor = dto.Floor;
            seatLayout.SeatType = dto.SeatType;
            seatLayout.PositionX = dto.PositionX;
            seatLayout.PositionY = dto.PositionY;

            await _context.SaveChangesAsync();
        }
    }
}
