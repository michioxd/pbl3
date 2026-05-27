using Microsoft.AspNetCore.Mvc;
using Pbl3.Enums;
using System;
using System.Threading.Tasks;

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
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var result = await _busesService.GetCompanyBusesAsync(companyId.Value, page, pageSize);
            return Ok(result);
        }

        [HttpGet("company/profile")]
        public async Task<IActionResult> GetCompanyProfile()
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var result = await _profileService.GetCompanyProfileAsync(companyId.Value);
            return Ok(result);
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetBookedTickets(
            [FromQuery] TicketStatus? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var result = await _busesService.GetBookedTicketsAsync(companyId.Value, status, page, pageSize);
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
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var result = await _busesService.GetTripsAsync(companyId.Value, year, month, page, pageSize);
            return Ok(result);
        }

        [HttpGet("bus-types/{busTypeId:guid}/seat-layouts")]
        public async Task<IActionResult> GetSeatLayouts(
            Guid busTypeId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var result = await _busesService.GetSeatLayoutsAsync(busTypeId, companyId.Value, page, pageSize);
            return Ok(result);
        }

        [HttpGet("bus-types/{busTypeId:guid}/amenities")]
        public async Task<IActionResult> GetBusTypeAmenities(Guid busTypeId)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var result = await _busesService.GetBusTypeAmenitiesAsync(busTypeId, companyId.Value);
            return Ok(result);
        }

        [HttpGet("stats/monthly")]
        public async Task<IActionResult> GetMonthlyTicketStats(
            [FromQuery] int year,
            [FromQuery] int month
        )
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var result = await _busesService.GetMonthlyTicketStatsAsync(companyId.Value, year, month);
            return Ok(result);
        }
    }
}
