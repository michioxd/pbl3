using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services.Admin;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system/revenue")]
    [Authorize(Policy = "AdminOnly")]
    [Tags("SystemAdmin")]
    public class RevenueAnalytics(IRevenueAnalyticsService revenueService) : ControllerBase
    {
        private readonly IRevenueAnalyticsService _revenueService = revenueService;

        [HttpGet("analytics")]
        public async Task<IActionResult> GetRevenueAnalytics(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int topRoutesLimit = 10,
            [FromQuery] int topCompaniesLimit = 10
        )
        {
            var result = await _revenueService.GetRevenueAnalyticsAsync(
                startDate,
                endDate,
                topRoutesLimit,
                topCompaniesLimit
            );
            return Ok(result);
        }
    }
}
