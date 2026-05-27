using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using System;
using System.Threading.Tasks;

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

            await _busesService.CreateBusAsync(companyId.Value, dto);
            return Ok(new { message = "Tạo xe thành công." });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteBus(Guid id)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            await _busesService.DeleteBusAsync(id, companyId.Value);
            return Ok(new { message = "Xóa xe thành công." });
        }

        [HttpPost("trips")]
        public async Task<IActionResult> CreateTrip([FromBody] CreateTripDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var tripIds = await _busesService.CreateTripAsync(companyId.Value, dto);
            return Ok(new { message = "Tạo chuyến xe thành công.", tripIds });
        }

        [HttpDelete("trips/{tripId:guid}")]
        public async Task<IActionResult> DeleteTrip(Guid tripId)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            await _busesService.DeleteTripAsync(tripId, companyId.Value);
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

            var layoutId = await _busesService.CreateSeatLayoutAsync(busTypeId, dto, companyId.Value);
            return Ok(new { message = "Tạo sơ đồ ghế thành công.", layoutId });
        }

        [HttpDelete("seat-layouts/{layoutId:guid}")]
        public async Task<IActionResult> DeleteSeatLayout(Guid layoutId)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            await _busesService.DeleteSeatLayoutAsync(layoutId, companyId.Value);
            return Ok(new { message = "Xóa sơ đồ ghế thành công." });
        }
    }
}
