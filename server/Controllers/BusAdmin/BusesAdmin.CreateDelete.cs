using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Models;

namespace Pbl3.Controllers.BusAdmin
{
    public partial class BusesController
    {
        [HttpPost]
        [Authorize(Policy = "BusAdmin")]
        public async Task<IActionResult> CreateBus([FromBody] CreateBusDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var isBusTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!isBusTypeExists)
                return BadRequest(new { message = "Loại xe không tồn tại." });

            var newBus = new Bus
            {
                BusID = Guid.NewGuid(),
                CompanyID = companyId.Value,
                BusTypeID = dto.BusTypeID,
                PlateNumber = dto.PlateNumber,
                IsActive = dto.IsActive,
            };

            _context.Buses.Add(newBus);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo xe thành công." });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteBus(Guid id)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == id);
            if (bus == null)
                return NotFound(new { message = "Không tìm thấy xe." });

            var hasTripsUsingBus = await _context.Trips.AnyAsync(t => t.BusID == id);
            if (hasTripsUsingBus)
            {
                return BadRequest(new { message = "Xe đã được gán cho chuyến xe, không thể xóa." });
            }

            if (bus.CompanyID != companyId.Value)
                return Forbid();

            if (bus.IsActive)
            {
                return BadRequest(new { message = "Xe đang hoạt động, không thể xóa." });
            }

            _context.Buses.Remove(bus);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa xe thành công." });
        }

        [HttpPost("trips")]
        public async Task<IActionResult> CreateTrip([FromBody] CreateTripDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var isRouteOwned = await IsRouteOwnedByCompanyAsync(companyId.Value, dto.RouteID);
            if (!isRouteOwned)
                return BadRequest(new { message = "Tuyến đường không thuộc nhà xe của bạn." });

            if (dto.BusID.HasValue)
            {
                var isBusOwned = await IsBusOwnedByCompanyAsync(companyId.Value, dto.BusID.Value);
                if (!isBusOwned)
                    return BadRequest(new { message = "Xe không thuộc nhà xe của bạn." });
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

            return Ok(new { message = "Tạo chuyến xe thành công.", tripId = trip.TripID });
        }

        [HttpDelete("trips/{tripId:guid}")]
        public async Task<IActionResult> DeleteTrip(Guid tripId)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var trip = await _context
                .Trips.Include(t => t.Tickets)
                .FirstOrDefaultAsync(t => t.TripID == tripId);

            if (trip == null)
                return NotFound(new { message = "Không tìm thấy chuyến xe." });

            var isTripOwned = await IsTripOwnedByCompanyAsync(companyId.Value, tripId);
            if (!isTripOwned)
                return Forbid();

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
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId.Value, busTypeId);
            if (!hasOwnership)
                return Forbid();

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
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var seatLayout = await _context.SeatLayouts.FirstOrDefaultAsync(s =>
                s.LayoutID == layoutId
            );
            if (seatLayout == null)
                return NotFound(new { message = "Không tìm thấy sơ đồ ghế." });

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(
                companyId.Value,
                seatLayout.BusTypeID
            );
            if (!hasOwnership)
                return Forbid();

            _context.SeatLayouts.Remove(seatLayout);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa sơ đồ ghế thành công." });
        }
    }
}
