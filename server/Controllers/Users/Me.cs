using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services.Users;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/user/me")]
    [Authorize(Policy = "UserOnly")]
    [Tags("User")]
    public class UserMeController : ControllerBase
    {
        private readonly IUserMeService _userMeService;

        public UserMeController(IUserMeService userMeService)
        {
            _userMeService = userMeService;
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
            throw new UnauthorizedAccessException("common:internal_server_error");
        }

        [HttpGet]
        public async Task<ActionResult<MeResponseDto>> GetDetails()
        {
            var userId = GetCurrentUserId();
            var result = await _userMeService.GetMeDetailsAsync(userId);
            return Ok(result);
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetMyTickets()
        {
            var userId = GetCurrentUserId();
            var result = await _userMeService.GetMyTicketsAsync(userId);
            return Ok(result);
        }
    }
}
