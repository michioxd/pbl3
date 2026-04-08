using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;


namespace Pbl3.Controllers.BusAdmin
{
    public partial class BusesController
    {
        [HttpPut("{id:guid}")]
        [Authorize(Policy = "ModOrAdmin")]
        public async Task<IActionResult> UpdateBus(Guid id, [FromBody] UpdateBusDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == id);
            if (bus == null)
                return NotFound(new { message = "Không tìm thấy xe." });

            if (bus.CompanyID != companyId.Value)
                return Forbid();

            bus.PlateNumber = dto.PlateNumber;
            bus.IsActive = dto.IsActive;
            bus.BusTypeID = dto.BusTypeID;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật xe thành công." });
        }

        [HttpPatch("{id:guid}/status")]
        public async Task<IActionResult> UpdateBusStatus(Guid id, [FromBody] UpdateBusStatusDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == id);
            if (bus == null)
                return NotFound(new { message = "Không tìm thấy xe." });

            if (bus.CompanyID != companyId.Value)
                return Forbid();

            bus.IsActive = dto.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái xe thành công." });
        }

        [HttpPut("company/profile")]
        public async Task<IActionResult> UpdateCompanyProfile([FromBody] UpdateCompanyProfileDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var company = await _context.BusCompanies.FirstOrDefaultAsync(c => c.CompanyID == companyId.Value);
            if (company == null)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            company.Name = dto.Name;
            company.Hotline = dto.Hotline;
            company.LicenseNumber = dto.LicenseNumber;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin nhà xe thành công." });
        }

        [HttpPut("trips/{tripId:guid}")]
        public async Task<IActionResult> UpdateTrip(Guid tripId, [FromBody] UpdateTripDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var trip = await _context.Trips.FirstOrDefaultAsync(t => t.TripID == tripId);
            if (trip == null)
                return NotFound(new { message = "Không tìm thấy chuyến xe." });

            var isTripOwned = await IsTripOwnedByCompanyAsync(companyId.Value, tripId);
            if (!isTripOwned)
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

            trip.RouteID = dto.RouteID;
            trip.BusID = dto.BusID;
            trip.BusTypeID = dto.BusTypeID;
            trip.DepartureDate = dto.DepartureDate;
            trip.DepartureTime = dto.DepartureTime;
            trip.ArrivalTime = dto.ArrivalTime;
            trip.Status = dto.Status;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật chuyến xe thành công." });
        }

        [HttpPatch("trips/{tripId:guid}/status")]
        public async Task<IActionResult> UpdateTripStatus(Guid tripId, [FromBody] UpdateTripStatusDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var trip = await _context.Trips.FirstOrDefaultAsync(t => t.TripID == tripId);
            if (trip == null)
                return NotFound(new { message = "Không tìm thấy chuyến xe." });

            var isTripOwned = await IsTripOwnedByCompanyAsync(companyId.Value, tripId);
            if (!isTripOwned)
                return Forbid();

            trip.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái chuyến xe thành công." });
        }

        [HttpPatch("bus-types/{busTypeId:guid}/amenities")]
        public async Task<IActionResult> UpdateBusTypeAmenities(Guid busTypeId, [FromBody] UpdateBusTypeAmenitiesDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId.Value, busTypeId);
            if (!hasOwnership)
                return Forbid();

            var busType = await _context.BusTypes.FirstOrDefaultAsync(b => b.BusTypeID == busTypeId);
            if (busType == null)
                return NotFound(new { message = "Không tìm thấy loại xe." });

            busType.Description = dto.Amenities;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật tiện ích thành công." });
        }

        [HttpPut("seat-layouts/{layoutId:guid}")]
        public async Task<IActionResult> UpdateSeatLayout(Guid layoutId, [FromBody] UpdateSeatLayoutDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var seatLayout = await _context.SeatLayouts.FirstOrDefaultAsync(s => s.LayoutID == layoutId);
            if (seatLayout == null)
                return NotFound(new { message = "Không tìm thấy sơ đồ ghế." });

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId.Value, seatLayout.BusTypeID);
            if (!hasOwnership)
                return Forbid();

            seatLayout.SeatLabel = dto.SeatLabel;
            seatLayout.Floor = dto.Floor;
            seatLayout.SeatType = dto.SeatType;
            seatLayout.PositionX = dto.PositionX;
            seatLayout.PositionY = dto.PositionY;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật sơ đồ ghế thành công." });
        }
    }
}
