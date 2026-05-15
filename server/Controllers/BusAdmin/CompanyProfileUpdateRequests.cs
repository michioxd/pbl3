using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Services;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("api/busadmin/company-update-requests")]
    [Authorize(Policy = "BusAdmin")]
    [Tags("BusAdmin")]
    public class CompanyProfileUpdateRequestsController : ControllerBase
    {
        private readonly ICompanyProfileUpdateRequestsService _requestsService;
        private readonly ICurrentUserContext _currentUserContext;
        private readonly IBusAdminOwnershipService _ownershipService;

        public CompanyProfileUpdateRequestsController(
            ICompanyProfileUpdateRequestsService requestsService,
            ICurrentUserContext currentUserContext,
            IBusAdminOwnershipService ownershipService
        )
        {
            _requestsService = requestsService;
            _currentUserContext = currentUserContext;
            _ownershipService = ownershipService;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentRequest()
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var companyId = await _ownershipService.GetCurrentCompanyIdAsync(userId);
            if (companyId == null)
                return Forbid();

            var result = await _requestsService.GetCurrentRequestAsync(companyId.Value);

            if (result.StatusCode == 200)
                return Ok(result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPost]
        public async Task<IActionResult> CreateRequest(
            [FromBody] CreateCompanyProfileUpdateRequestDto dto
        )
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var companyId = await _ownershipService.GetCurrentCompanyIdAsync(userId);
            if (companyId == null)
                return Forbid();

            var result = await _requestsService.CreateRequestAsync(companyId.Value, userId, dto);

            if (result.StatusCode == 201)
                return StatusCode(result.StatusCode, result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }
    }
}
