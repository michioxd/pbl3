using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Admin
{
    public partial class BusAdminUpgradeResponse
    {
        [HttpGet]
        public async Task<IActionResult> GetRequests(
            [FromQuery] BusAdminUpgradeRequestStatus? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            try
            {
                var result = await _upgradeService.GetRequestsAsync(status, page, pageSize);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("stats/pending-count")]
        public async Task<IActionResult> GetPendingCount()
        {
            var count = await _upgradeService.GetPendingCountAsync();
            return Ok(new { pendingCount = count });
        }

        [HttpPatch("{requestId:guid}/review")]
        public async Task<IActionResult> ReviewRequest(
            Guid requestId,
            [FromBody] ReviewBusAdminUpgradeRequestDto dto
        )
        {
            try
            {
                var reviewerUserId = _currentUserContext.GetRequiredUserId();
                var result = await _upgradeService.ReviewRequestAsync(requestId, dto, reviewerUserId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
