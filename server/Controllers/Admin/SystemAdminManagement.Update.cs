using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpPut("buses/{id:guid}")]
        public async Task<IActionResult> UpdateBus(Guid id, [FromBody] UpdateBusDto dto)
        {
            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == id);
            if (bus == null)
                return NotFound(new { message = "Không tìm thấy xe." });

            var busTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!busTypeExists)
                return BadRequest(new { message = "Loại xe không tồn tại." });

            bus.PlateNumber = dto.PlateNumber;
            bus.IsActive = dto.IsActive;
            bus.BusTypeID = dto.BusTypeID;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật xe thành công." });
        }

        [HttpPut("companies/{companyId:guid}/profile")]
        public async Task<IActionResult> UpdateCompanyProfile(
            Guid companyId,
            [FromBody] UpdateCompanyProfileDto dto
        )
        {
            var company = await _context.BusCompanies.FirstOrDefaultAsync(c =>
                c.CompanyID == companyId
            );
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
            var trip = await _context.Trips.FirstOrDefaultAsync(t => t.TripID == tripId);
            if (trip == null)
                return NotFound(new { message = "Không tìm thấy chuyến xe." });

            var route = await _context
                .BusRoutes.AsNoTracking()
                .Where(r => r.RouteID == dto.RouteID)
                .Select(r => new { r.RouteID, r.CompanyID })
                .FirstOrDefaultAsync();
            if (route == null)
                return BadRequest(new { message = "Tuyến đường không tồn tại." });

            if (dto.BusID.HasValue)
            {
                var isBusOwned = await IsBusOwnedByCompanyAsync(route.CompanyID, dto.BusID.Value);
                if (!isBusOwned)
                    return BadRequest(new { message = "Xe không thuộc nhà xe của tuyến đường." });
            }

            var busTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!busTypeExists)
                return BadRequest(new { message = "Loại xe không tồn tại." });

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

        [HttpPatch("bus-types/{busTypeId:guid}/amenities")]
        public async Task<IActionResult> UpdateBusTypeAmenities(
            Guid busTypeId,
            [FromBody] UpdateBusTypeAmenitiesDto dto
        )
        {
            var busType = await _context.BusTypes.FirstOrDefaultAsync(b =>
                b.BusTypeID == busTypeId
            );
            if (busType == null)
                return NotFound(new { message = "Không tìm thấy loại xe." });

            busType.Description = dto.Amenities;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật tiện ích thành công." });
        }

        [HttpPut("seat-layouts/{layoutId:guid}")]
        public async Task<IActionResult> UpdateSeatLayout(
            Guid layoutId,
            [FromBody] UpdateSeatLayoutDto dto
        )
        {
            var seatLayout = await _context.SeatLayouts.FirstOrDefaultAsync(s =>
                s.LayoutID == layoutId
            );
            if (seatLayout == null)
                return NotFound(new { message = "Không tìm thấy sơ đồ ghế." });

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
