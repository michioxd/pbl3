using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Services.Admin;

namespace Pbl3.Controllers.Admin
{
    [Authorize(Roles = "SysAdmin")]
    [Route("api/admin/system/trips")]
    [ApiController]
    public class TripMonitoringController(ITripMonitoringService monitoringService) : ControllerBase
    {
        private readonly ITripMonitoringService _monitoringService = monitoringService;

        [HttpGet]
        public async Task<IActionResult> GetAllTrips(
            [FromQuery] string? q,
            [FromQuery] List<string>? statuses,
            [FromQuery] Guid? companyId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortDirection,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            try
            {
                var result = await _monitoringService.GetAllTripsAsync(
                    q,
                    statuses,
                    companyId,
                    startDate,
                    endDate,
                    sortBy,
                    sortDirection,
                    page,
                    pageSize
                );
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveTrips()
        {
            var result = await _monitoringService.GetActiveTripsAsync();
            return Ok(result);
        }
    }

    [Authorize(Roles = "SysAdmin")]
    [Route("api/admin/system/routes")]
    [ApiController]
    public class RoutePerformanceController(ITripMonitoringService monitoringService) : ControllerBase
    {
        private readonly ITripMonitoringService _monitoringService = monitoringService;

        [HttpGet("performance")]
        public async Task<IActionResult> GetRoutePerformance(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate
        )
        {
            var result = await _monitoringService.GetRoutePerformanceAsync(startDate, endDate);
            return Ok(result);
        }
    }
}
