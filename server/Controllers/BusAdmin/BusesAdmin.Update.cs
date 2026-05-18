using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;

namespace Pbl3.Controllers.BusAdmin
{
    public partial class BusesController
    {
        [HttpPut("{id:guid}")]
        [Authorize(Policy = "BusAdmin")]
        public async Task<IActionResult> UpdateBus(Guid id, [FromBody] UpdateBusDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _commandService.UpdateBusAsync(companyId.Value, id, dto);
            return HandleCommandResult(result);
        }

        [HttpPut("company/profile")]
        public async Task<IActionResult> UpdateCompanyProfile(
            [FromBody] UpdateCompanyProfileDto dto
        )
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _commandService.UpdateCompanyProfileAsync(companyId.Value, userId, dto);
            return HandleCommandResult(result);
        }

        [HttpPut("trips/{tripId:guid}")]
        public async Task<IActionResult> UpdateTrip(Guid tripId, [FromBody] UpdateTripDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

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

        [HttpPatch("bus-types/{busTypeId:guid}/amenities")]
        public async Task<IActionResult> UpdateBusTypeAmenities(
            Guid busTypeId,
            [FromBody] UpdateBusTypeAmenitiesDto dto
        )
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _commandService.UpdateBusTypeAmenitiesAsync(companyId.Value, busTypeId, dto);
            return HandleCommandResult(result);
        }

        [HttpPut("seat-layouts/{layoutId:guid}")]
        public async Task<IActionResult> UpdateSeatLayout(
            Guid layoutId,
            [FromBody] UpdateSeatLayoutDto dto
        )
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _commandService.UpdateSeatLayoutAsync(companyId.Value, layoutId, dto);
            return HandleCommandResult(result);
        }
    }
}
