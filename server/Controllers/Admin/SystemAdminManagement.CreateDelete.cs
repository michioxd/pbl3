using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using System;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpPost("companies/{companyId:guid}/buses")]
        public async Task<IActionResult> CreateBus(Guid companyId, [FromBody] CreateBusDto dto)
        {
            var busId = await _service.CreateBusAsync(companyId, dto);
            return Ok(new { message = "Tạo xe thành công.", busId });
        }

        [HttpDelete("buses/{id:guid}")]
        public async Task<IActionResult> DeleteBus(Guid id)
        {
            await _service.DeleteBusAsync(id);
            return Ok(new { message = "Xóa xe thành công." });
        }

        [HttpPost("companies/{companyId:guid}/trips")]
        public async Task<IActionResult> CreateTrip(Guid companyId, [FromBody] CreateTripDto dto)
        {
            var tripId = await _service.CreateTripAsync(companyId, dto);
            return Ok(new { message = "Tạo chuyến xe thành công.", tripId });
        }

        [HttpDelete("trips/{tripId:guid}")]
        public async Task<IActionResult> DeleteTrip(Guid tripId)
        {
            await _service.DeleteTripAsync(tripId);
            return Ok(new { message = "Xóa chuyến xe thành công." });
        }

        [HttpPost("bus-types/{busTypeId:guid}/seat-layouts")]
        public async Task<IActionResult> CreateSeatLayout(
            Guid busTypeId,
            [FromBody] CreateSeatLayoutDto dto
        )
        {
            var layoutId = await _service.CreateSeatLayoutAsync(busTypeId, dto);
            return Ok(new { message = "Tạo sơ đồ ghế thành công.", layoutId });
        }

        [HttpDelete("seat-layouts/{layoutId:guid}")]
        public async Task<IActionResult> DeleteSeatLayout(Guid layoutId)
        {
            await _service.DeleteSeatLayoutAsync(layoutId);
            return Ok(new { message = "Xóa sơ đồ ghế thành công." });
        }
    }
}
