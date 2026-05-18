using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system/revenue")]
    [Authorize(Policy = "AdminOnly")]
    [Tags("SystemAdmin")]
    public class RevenueAnalytics : ControllerBase
    {
        private readonly IRevenueAnalyticsService _analyticsService;

        public RevenueAnalytics(IRevenueAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetRevenueAnalytics(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int topRoutesLimit = 10,
            [FromQuery] int topCompaniesLimit = 10
        )
        {
            var result = await _analyticsService.GetRevenueAnalyticsAsync(startDate, endDate, topRoutesLimit, topCompaniesLimit);
            return Ok(result);
        }
    }
}
