using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services.BusAdmin;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("api/busadmin")]
    [Authorize(Policy = "BusAdmin")]
    [Tags("BusAdmin")]
    public partial class CreateBusAdmin : ControllerBase
    {
        private readonly IBusCompanyRegistrationService _registrationService;

        public CreateBusAdmin(IBusCompanyRegistrationService registrationService)
        {
            _registrationService = registrationService;
        }

        private Guid GetCurrentUserId()
        {
            var userIdString =
                User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userIdString, out Guid userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("Không tìm thấy UserID trong token.");
        }

        [HttpPost("addBusCompany")]
        public async Task<IActionResult> AddBusCompany([FromBody] Infor_BusCompany company)
        {
            var userId = GetCurrentUserId();
            var result = await _registrationService.AddBusCompanyAsync(company, userId);
            return StatusCode(StatusCodes.Status201Created, result);
        }
    }
}
