using Microsoft.AspNetCore.Mvc;
using Pbl3.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpGet("companies")]
        public async Task<IActionResult> GetCompanies(
            [FromQuery] string? q,
            [FromQuery] List<string>? statuses,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortDirection,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var result = await _service.GetCompaniesAsync(q, statuses, sortBy, sortDirection, page, pageSize);
            return Ok(result);
        }

        [HttpGet("companies/stats")]
        public async Task<IActionResult> GetCompanyStats()
        {
            var result = await _service.GetCompanyStatsAsync();
            return Ok(result);
        }

        [HttpGet("companies/{companyId:guid}/profile")]
        public async Task<IActionResult> GetCompanyProfile(Guid companyId)
        {
            var result = await _service.GetCompanyProfileAsync(companyId);
            return Ok(result);
        }

        [HttpGet("companies/{companyId:guid}/buses")]
        public async Task<IActionResult> GetCompanyBuses(Guid companyId)
        {
            var result = await _service.GetCompanyBusesAsync(companyId);
            return Ok(result);
        }

        [HttpGet("companies/{companyId:guid}/routes")]
        public async Task<IActionResult> GetCompanyRoutes(Guid companyId)
        {
            var result = await _service.GetCompanyRoutesAsync(companyId);
            return Ok(result);
        }

        [HttpGet("companies/{companyId:guid}/analytics")]
        public async Task<IActionResult> GetCompanyAnalytics(
            Guid companyId,
            [FromQuery] int? year,
            [FromQuery] int? month
        )
        {
            var result = await _service.GetCompanyAnalyticsAsync(companyId, year, month);
            return Ok(result);
        }

        [HttpGet("companies/{companyId:guid}/tickets")]
        public async Task<IActionResult> GetBookedTickets(
            Guid companyId,
            [FromQuery] TicketStatus? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var result = await _service.GetBookedTicketsAsync(companyId, status, page, pageSize);
            return Ok(result);
        }

        [HttpGet("companies/{companyId:guid}/trips")]
        public async Task<IActionResult> GetTrips(
            Guid companyId,
            [FromQuery] int? year,
            [FromQuery] int? month,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var result = await _service.GetTripsAsync(companyId, year, month, page, pageSize);
            return Ok(result);
        }

        [HttpGet("bus-types/{busTypeId:guid}/seat-layouts")]
        public async Task<IActionResult> GetSeatLayouts(Guid busTypeId)
        {
            var result = await _service.GetSeatLayoutsAsync(busTypeId);
            return Ok(result);
        }

        [HttpGet("bus-types/{busTypeId:guid}/amenities")]
        public async Task<IActionResult> GetBusTypeAmenities(Guid busTypeId)
        {
            var result = await _service.GetBusTypeAmenitiesAsync(busTypeId);
            return Ok(result);
        }

        [HttpGet("users/{userId:guid}")]
        public async Task<IActionResult> GetUserDetails(Guid userId)
        {
            var result = await _service.GetUserDetailsAsync(userId);
            return Ok(result);
        }

        [HttpGet("users/{userId:guid}/tickets")]
        public async Task<IActionResult> GetUserTickets(Guid userId)
        {
            var result = await _service.GetUserTicketsAsync(userId);
            return Ok(result);
        }

        [HttpGet("stats/monthly")]
        public async Task<IActionResult> GetMonthlyTicketStats(
            [FromQuery] int year,
            [FromQuery] int month
        )
        {
            var result = await _service.GetMonthlyTicketStatsAsync(year, month);
            return Ok(result);
        }
    }
}
