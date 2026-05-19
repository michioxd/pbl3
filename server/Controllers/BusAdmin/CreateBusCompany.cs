using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("api/busadmin")]
    [Authorize(Policy = "BusAdmin")]
    [Tags("BusAdmin")]
    public partial class CreateBusAdmin : ControllerBase
    {
        private readonly IBusCompanyRegistrationService _registrationService;
        private readonly ICurrentUserContext _currentUserContext;

        public CreateBusAdmin(IBusCompanyRegistrationService registrationService, ICurrentUserContext currentUserContext)
        {
            _registrationService = registrationService;
            _currentUserContext = currentUserContext;
        }


        [HttpPost("addBusCompany")]
        public async Task<IActionResult> AddBusCompany([FromBody] Infor_BusCompany company)
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _registrationService.RegisterCompanyAsync(userId, company);

            if (result.StatusCode == 200 || result.StatusCode == 201)
                return StatusCode(result.StatusCode, result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }
    }
}
