using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Enums;

namespace Pbl3.Controllers.BusAdmin
{
    public partial class BusesController
    {
        [HttpGet("company")]
        public async Task<IActionResult> GetCompanyBuses(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (!IsValidPageSize(pageSize))
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _busesAdminService.GetCompanyBusesAsync(companyId.Value, page, pageSize);
            return Ok(result);
        }

        [HttpGet("company/profile")]
        public async Task<IActionResult> GetCompanyProfile()
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var company = await _busesAdminService.GetCompanyProfileAsync(companyId.Value);

            if (company == null)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            return Ok(company);
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetBookedTickets(
            [FromQuery] TicketStatus? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (!IsValidPageSize(pageSize))
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _busesAdminService.GetBookedTicketsAsync(companyId.Value, status, page, pageSize);
            return Ok(result);
        }

        [HttpGet("trips")]
        public async Task<IActionResult> GetTrips(
            [FromQuery] int? year,
            [FromQuery] int? month,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (!IsValidPageSize(pageSize))
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _busesAdminService.GetTripsAsync(companyId.Value, year, month, page, pageSize);
            return Ok(result);
        }

        [HttpGet("bus-types/{busTypeId:guid}/seat-layouts")]
        public async Task<IActionResult> GetSeatLayouts(
            Guid busTypeId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (!IsValidPageSize(pageSize))
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId.Value, busTypeId);
            if (!hasOwnership)
                return Forbid();

            var result = await _busesAdminService.GetSeatLayoutsAsync(busTypeId, page, pageSize);
            return Ok(result);
        }

        [HttpGet("bus-types/{busTypeId:guid}/amenities")]
        public async Task<IActionResult> GetBusTypeAmenities(Guid busTypeId)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var hasOwnership = await IsBusTypeOwnedByCompanyAsync(companyId.Value, busTypeId);
            if (!hasOwnership)
                return Forbid();

            var result = await _busesAdminService.GetBusTypeAmenitiesAsync(busTypeId);

            if (result == null)
                return NotFound(new { message = "Không tìm thấy loại xe." });

            return Ok(result);
        }

        [HttpGet("stats/monthly")]
        public async Task<IActionResult> GetMonthlyTicketStats(
            [FromQuery] int year,
            [FromQuery] int month
        )
        {
            if (year < 2000 || year > 3000)
                return BadRequest(new { message = "Year không hợp lệ." });

            if (month < 1 || month > 12)
                return BadRequest(new { message = "Month phải từ 1 đến 12." });

            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _busesAdminService.GetMonthlyTicketStatsAsync(companyId.Value, year, month);
            return Ok(result);
        }
    }
}
