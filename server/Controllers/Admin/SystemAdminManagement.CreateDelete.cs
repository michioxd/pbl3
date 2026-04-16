using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Models;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpPost("companies/{companyId:guid}/buses")]
        public async Task<IActionResult> CreateBus(Guid companyId, [FromBody] CreateBusDto dto)
        {
            var companyExists = await _context.BusCompanies.AnyAsync(c => c.CompanyID == companyId);
            if (!companyExists)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            var isBusTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!isBusTypeExists)
                return BadRequest(new { message = "Loại xe không tồn tại." });

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

            return Ok(new { message = "Tạo xe thành công.", busId = newBus.BusID });
        }

        [HttpDelete("buses/{id:guid}")]
        public async Task<IActionResult> DeleteBus(Guid id)
        {
            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == id);
            if (bus == null)
                return NotFound(new { message = "Không tìm thấy xe." });

            var hasTripsUsingBus = await _context.Trips.AnyAsync(t => t.BusID == id);
            if (hasTripsUsingBus)
            {
                return BadRequest(new { message = "Xe đã được gán cho chuyến xe, không thể xóa." });
            }

            if (bus.IsActive)
            {
                return BadRequest(new { message = "Xe đang hoạt động, không thể xóa." });
            }

            _context.Buses.Remove(bus);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa xe thành công." });
        }

        [HttpPost("companies/{companyId:guid}/trips")]
        public async Task<IActionResult> CreateTrip(Guid companyId, [FromBody] CreateTripDto dto)
        {
            var companyExists = await _context.BusCompanies.AnyAsync(c => c.CompanyID == companyId);
            if (!companyExists)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            var isRouteOwned = await IsRouteOwnedByCompanyAsync(companyId, dto.RouteID);
            if (!isRouteOwned)
                return BadRequest(new { message = "Tuyến đường không thuộc nhà xe đã chọn." });

            if (dto.BusID.HasValue)
            {
                var isBusOwned = await IsBusOwnedByCompanyAsync(companyId, dto.BusID.Value);
                if (!isBusOwned)
                    return BadRequest(new { message = "Xe không thuộc nhà xe đã chọn." });
            }

            var isBusTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!isBusTypeExists)
                return BadRequest(new { message = "Loại xe không tồn tại." });

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

            return Ok(new { message = "Tạo chuyến xe thành công.", tripId = trip.TripID });
        }

        [HttpDelete("trips/{tripId:guid}")]
        public async Task<IActionResult> DeleteTrip(Guid tripId)
        {
            var trip = await _context
                .Trips.Include(t => t.Tickets)
                .FirstOrDefaultAsync(t => t.TripID == tripId);

            if (trip == null)
                return NotFound(new { message = "Không tìm thấy chuyến xe." });

            if (trip.Tickets.Any())
            {
                return BadRequest(new { message = "Chuyến xe đã có vé, không thể xóa." });
            }

            _context.Trips.Remove(trip);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa chuyến xe thành công." });
        }

        [HttpPost("bus-types/{busTypeId:guid}/seat-layouts")]
        public async Task<IActionResult> CreateSeatLayout(
            Guid busTypeId,
            [FromBody] CreateSeatLayoutDto dto
        )
        {
            var busTypeExists = await IsBusTypeExistsAsync(busTypeId);
            if (!busTypeExists)
                return NotFound(new { message = "Không tìm thấy loại xe." });

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

            return Ok(
                new { message = "Tạo sơ đồ ghế thành công.", layoutId = seatLayout.LayoutID }
            );
        }

        [HttpDelete("seat-layouts/{layoutId:guid}")]
        public async Task<IActionResult> DeleteSeatLayout(Guid layoutId)
        {
            var seatLayout = await _context.SeatLayouts.FirstOrDefaultAsync(s =>
                s.LayoutID == layoutId
            );
            if (seatLayout == null)
                return NotFound(new { message = "Không tìm thấy sơ đồ ghế." });

            _context.SeatLayouts.Remove(seatLayout);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa sơ đồ ghế thành công." });
        }
    }
}
