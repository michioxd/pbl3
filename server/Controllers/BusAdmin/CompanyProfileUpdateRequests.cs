using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;
using Pbl3.Services.BusAdmin;
using System;
using System.Threading.Tasks;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("api/busadmin/company-update-requests")]
    [Authorize(Policy = "BusAdmin")]
    [Tags("BusAdmin")]
    public class CompanyProfileUpdateRequestsController : ControllerBase
    {
        private readonly IBusAdminProfileService _profileService;
        private readonly ICurrentUserContext _currentUserContext;
        private readonly IBusAdminOwnershipService _ownershipService;

        public CompanyProfileUpdateRequestsController(
            IBusAdminProfileService profileService,
            ICurrentUserContext currentUserContext,
            IBusAdminOwnershipService ownershipService
        )
        {
            _profileService = profileService;
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

            var request = await _profileService.GetCurrentRequestAsync(companyId.Value);
            return Ok(request);
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

            var result = await _profileService.CreateRequestAsync(dto, companyId.Value, userId);
            return StatusCode(StatusCodes.Status201Created, result);
        }
    }
}
