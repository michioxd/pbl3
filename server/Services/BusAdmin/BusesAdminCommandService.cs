using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services
{
    public interface IBusesAdminCommandService
    {
        Task<(int StatusCode, string? ErrorMessage, object? Data)> CreateBusAsync(Guid companyId, CreateBusDto dto);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> DeleteBusAsync(Guid companyId, Guid busId);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> CreateTripAsync(Guid companyId, CreateTripDto dto);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> DeleteTripAsync(Guid companyId, Guid tripId);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> CreateSeatLayoutAsync(Guid companyId, Guid busTypeId, CreateSeatLayoutDto dto);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> DeleteSeatLayoutAsync(Guid companyId, Guid layoutId);

        Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateBusAsync(Guid companyId, Guid busId, UpdateBusDto dto);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateCompanyProfileAsync(Guid companyId, Guid userId, UpdateCompanyProfileDto dto);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateTripAsync(Guid companyId, Guid tripId, UpdateTripDto dto);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateBusTypeAmenitiesAsync(Guid companyId, Guid busTypeId, UpdateBusTypeAmenitiesDto dto);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateSeatLayoutAsync(Guid companyId, Guid layoutId, UpdateSeatLayoutDto dto);
    }

    public class BusesAdminCommandService : IBusesAdminCommandService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBusAdminOwnershipService _ownershipService;

        public BusesAdminCommandService(ApplicationDbContext context, IBusAdminOwnershipService ownershipService)
        {
            _context = context;
            _ownershipService = ownershipService;
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> CreateBusAsync(Guid companyId, CreateBusDto dto)
        {
            var isBusTypeExists = await _ownershipService.IsBusTypeExistsAsync(dto.BusTypeID);
            if (!isBusTypeExists)
                return (400, "Loại xe không tồn tại.", null);

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

            return (200, null, new { message = "Tạo xe thành công." });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> DeleteBusAsync(Guid companyId, Guid busId)
        {
            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == busId);
            if (bus == null)
                return (404, "Không tìm thấy xe.", null);

            var hasTripsUsingBus = await _context.Trips.AnyAsync(t => t.BusID == busId);
            if (hasTripsUsingBus)
                return (400, "Xe đã được gán cho chuyến xe, không thể xóa.", null);

            if (bus.CompanyID != companyId)
                return (403, "Forbidden", null);

            if (bus.IsActive)
                return (400, "Xe đang hoạt động, không thể xóa.", null);

            _context.Buses.Remove(bus);
            await _context.SaveChangesAsync();

            return (200, null, new { message = "Xóa xe thành công." });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> CreateTripAsync(Guid companyId, CreateTripDto dto)
        {
            var isRouteOwned = await _ownershipService.IsRouteOwnedByCompanyAsync(companyId, dto.RouteID);
            if (!isRouteOwned)
                return (400, "Tuyến đường không thuộc nhà xe của bạn.", null);

            if (dto.BusID.HasValue)
            {
                var isBusOwned = await _ownershipService.IsBusOwnedByCompanyAsync(companyId, dto.BusID.Value);
                if (!isBusOwned)
                    return (400, "Xe không thuộc nhà xe của bạn.", null);
            }

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

            return (200, null, new { message = "Tạo chuyến xe thành công.", tripId = trip.TripID });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> DeleteTripAsync(Guid companyId, Guid tripId)
        {
            var trip = await _context.Trips.Include(t => t.Tickets).FirstOrDefaultAsync(t => t.TripID == tripId);
            if (trip == null)
                return (404, "Không tìm thấy chuyến xe.", null);

            var isTripOwned = await _ownershipService.IsTripOwnedByCompanyAsync(companyId, tripId);
            if (!isTripOwned)
                return (403, "Forbidden", null);

            if (trip.Tickets.Any())
                return (400, "Chuyến xe đã có vé, không thể xóa.", null);

            _context.Trips.Remove(trip);
            await _context.SaveChangesAsync();

            return (200, null, new { message = "Xóa chuyến xe thành công." });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> CreateSeatLayoutAsync(Guid companyId, Guid busTypeId, CreateSeatLayoutDto dto)
        {
            var hasOwnership = await _ownershipService.IsBusTypeOwnedByCompanyAsync(companyId, busTypeId);
            if (!hasOwnership)
                return (403, "Forbidden", null);

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

            return (200, null, new { message = "Tạo sơ đồ ghế thành công.", layoutId = seatLayout.LayoutID });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> DeleteSeatLayoutAsync(Guid companyId, Guid layoutId)
        {
            var seatLayout = await _context.SeatLayouts.FirstOrDefaultAsync(s => s.LayoutID == layoutId);
            if (seatLayout == null)
                return (404, "Không tìm thấy sơ đồ ghế.", null);

            var hasOwnership = await _ownershipService.IsBusTypeOwnedByCompanyAsync(companyId, seatLayout.BusTypeID);
            if (!hasOwnership)
                return (403, "Forbidden", null);

            _context.SeatLayouts.Remove(seatLayout);
            await _context.SaveChangesAsync();

            return (200, null, new { message = "Xóa sơ đồ ghế thành công." });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateBusAsync(Guid companyId, Guid busId, UpdateBusDto dto)
        {
            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == busId);
            if (bus == null)
                return (404, "Không tìm thấy xe.", null);

            if (bus.CompanyID != companyId)
                return (403, "Forbidden", null);

            bus.PlateNumber = dto.PlateNumber;
            bus.IsActive = dto.IsActive;
            bus.BusTypeID = dto.BusTypeID;

            await _context.SaveChangesAsync();
            return (200, null, new { message = "Cập nhật xe thành công." });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateCompanyProfileAsync(Guid companyId, Guid userId, UpdateCompanyProfileDto dto)
        {
            var hasPendingRequest = await _context.CompanyProfileUpdateRequests.AnyAsync(r =>
                r.CompanyID == companyId
                && r.Status == CompanyProfileUpdateRequestStatus.Pending
            );

            if (hasPendingRequest)
                return (409, "Bạn đã có yêu cầu cập nhật đang chờ duyệt.", null);

            var request = new CompanyProfileUpdateRequest
            {
                RequestID = Guid.NewGuid(),
                CompanyID = companyId,
                RequesterUserID = userId,
                Name = dto.Name.Trim(),
                LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber) ? null : dto.LicenseNumber.Trim(),
                Hotline = string.IsNullOrWhiteSpace(dto.Hotline) ? null : dto.Hotline.Trim(),
                Status = CompanyProfileUpdateRequestStatus.Pending,
                RequestedAt = DateTime.UtcNow,
            };

            _context.CompanyProfileUpdateRequests.Add(request);
            await _context.SaveChangesAsync();

            return (201, null, new { message = "Đã gửi yêu cầu cập nhật hồ sơ nhà xe." });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateTripAsync(Guid companyId, Guid tripId, UpdateTripDto dto)
        {
            var trip = await _context.Trips.FirstOrDefaultAsync(t => t.TripID == tripId);
            if (trip == null)
                return (404, "Không tìm thấy chuyến xe.", null);

            var isTripOwned = await _ownershipService.IsTripOwnedByCompanyAsync(companyId, tripId);
            if (!isTripOwned)
                return (403, "Forbidden", null);

            var isRouteOwned = await _ownershipService.IsRouteOwnedByCompanyAsync(companyId, dto.RouteID);
            if (!isRouteOwned)
                return (400, "Tuyến đường không thuộc nhà xe của bạn.", null);

            if (dto.BusID.HasValue)
            {
                var isBusOwned = await _ownershipService.IsBusOwnedByCompanyAsync(companyId, dto.BusID.Value);
                if (!isBusOwned)
                    return (400, "Xe không thuộc nhà xe của bạn.", null);
            }

            trip.RouteID = dto.RouteID;
            trip.BusID = dto.BusID;
            trip.BusTypeID = dto.BusTypeID;
            trip.DepartureDate = dto.DepartureDate;
            trip.DepartureTime = dto.DepartureTime;
            trip.ArrivalTime = dto.ArrivalTime;
            trip.Status = dto.Status;

            await _context.SaveChangesAsync();
            return (200, null, new { message = "Cập nhật chuyến xe thành công." });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateBusTypeAmenitiesAsync(Guid companyId, Guid busTypeId, UpdateBusTypeAmenitiesDto dto)
        {
            var hasOwnership = await _ownershipService.IsBusTypeOwnedByCompanyAsync(companyId, busTypeId);
            if (!hasOwnership)
                return (403, "Forbidden", null);

            var busType = await _context.BusTypes.FirstOrDefaultAsync(b => b.BusTypeID == busTypeId);
            if (busType == null)
                return (404, "Không tìm thấy loại xe.", null);

            busType.Description = dto.Amenities;
            await _context.SaveChangesAsync();

            return (200, null, new { message = "Cập nhật tiện ích thành công." });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateSeatLayoutAsync(Guid companyId, Guid layoutId, UpdateSeatLayoutDto dto)
        {
            var seatLayout = await _context.SeatLayouts.FirstOrDefaultAsync(s => s.LayoutID == layoutId);
            if (seatLayout == null)
                return (404, "Không tìm thấy sơ đồ ghế.", null);

            var hasOwnership = await _ownershipService.IsBusTypeOwnedByCompanyAsync(companyId, seatLayout.BusTypeID);
            if (!hasOwnership)
                return (403, "Forbidden", null);

            seatLayout.SeatLabel = dto.SeatLabel;
            seatLayout.Floor = dto.Floor;
            seatLayout.SeatType = dto.SeatType;
            seatLayout.PositionX = dto.PositionX;
            seatLayout.PositionY = dto.PositionY;

            await _context.SaveChangesAsync();
            return (200, null, new { message = "Cập nhật sơ đồ ghế thành công." });
        }
    }
}
