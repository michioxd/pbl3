using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Services;
using Pbl3.Services.Admin;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system/company-update-requests")]
    [Authorize(Policy = "AdminOnly")]
    [Tags("SystemAdmin")]
    public class CompanyProfileUpdateRequestsController(
        ICompanyProfileUpdateRequestService requestService,
        ICurrentUserContext currentUserContext
    ) : ControllerBase
    {
        private readonly ICompanyProfileUpdateRequestService _requestService = requestService;
        private readonly ICurrentUserContext _currentUserContext = currentUserContext;

        [HttpGet]
        public async Task<IActionResult> GetRequests(
            [FromQuery] CompanyProfileUpdateRequestStatus? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            try
            {
                var result = await _requestService.GetRequestsAsync(status, page, pageSize);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{requestId:guid}/review")]
        public async Task<IActionResult> ReviewRequest(
            Guid requestId,
            [FromBody] ReviewCompanyProfileUpdateRequestDto dto
        )
        {
            try
            {
                var reviewerId = _currentUserContext.GetRequiredUserId();
                await _requestService.ReviewRequestAsync(requestId, dto, reviewerId);
                return Ok(new { message = "Đã cập nhật trạng thái yêu cầu." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }
    }
}
