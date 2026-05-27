using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using System;
using System.Threading.Tasks;

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

            await _busesService.UpdateBusAsync(id, dto, companyId.Value);
            return Ok(new { message = "Cập nhật xe thành công." });
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
            var result = await _profileService.UpdateCompanyProfileRequestAsync(dto, companyId.Value, userId);
            return StatusCode(StatusCodes.Status201Created, result);
        }

        [HttpPut("trips/{tripId:guid}")]
        public async Task<IActionResult> UpdateTrip(Guid tripId, [FromBody] UpdateTripDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            await _busesService.UpdateTripAsync(tripId, dto, companyId.Value);
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

            await _busesService.UpdateBusTypeAmenitiesAsync(busTypeId, dto, companyId.Value);
            return Ok(new { message = "Cập nhật tiện ích thành công." });
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

            await _busesService.UpdateSeatLayoutAsync(layoutId, dto, companyId.Value);
            return Ok(new { message = "Cập nhật sơ đồ ghế thành công." });
        }
    }
}
