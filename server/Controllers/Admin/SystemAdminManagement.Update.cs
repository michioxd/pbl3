using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using System;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpPut("buses/{id:guid}")]
        public async Task<IActionResult> UpdateBus(Guid id, [FromBody] UpdateBusDto dto)
        {
            await _service.UpdateBusAsync(id, dto);
            return Ok(new { message = "Cập nhật xe thành công." });
        }

        [HttpPut("companies/{companyId:guid}/profile")]
        public async Task<IActionResult> UpdateCompanyProfile(
            Guid companyId,
            [FromBody] UpdateCompanyProfileDto dto
        )
        {
            await _service.UpdateCompanyProfileAsync(companyId, dto);
            return Ok(new { message = "Cập nhật thông tin nhà xe thành công." });
        }

        [HttpPut("trips/{tripId:guid}")]
        public async Task<IActionResult> UpdateTrip(Guid tripId, [FromBody] UpdateTripDto dto)
        {
            await _service.UpdateTripAsync(tripId, dto);
            return Ok(new { message = "Cập nhật chuyến xe thành công." });
        }

        [HttpPatch("bus-types/{busTypeId:guid}/amenities")]
        public async Task<IActionResult> UpdateBusTypeAmenities(
            Guid busTypeId,
            [FromBody] UpdateBusTypeAmenitiesDto dto
        )
        {
            await _service.UpdateBusTypeAmenitiesAsync(busTypeId, dto);
            return Ok(new { message = "Cập nhật tiện ích thành công." });
        }

        [HttpPut("seat-layouts/{layoutId:guid}")]
        public async Task<IActionResult> UpdateSeatLayout(
            Guid layoutId,
            [FromBody] UpdateSeatLayoutDto dto
        )
        {
            await _service.UpdateSeatLayoutAsync(layoutId, dto);
            return Ok(new { message = "Cập nhật sơ đồ ghế thành công." });
        }
    }
}
