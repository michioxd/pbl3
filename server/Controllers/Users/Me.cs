using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/user/me")]
    [Authorize(Policy = "UserOnly")]
    [Tags("User")]
    public class UserMeController : ControllerBase
    {
        private readonly IMeService _meService;

        public UserMeController(IMeService meService)
        {
            _meService = meService;
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

            var response = await _meService.GetDetailsAsync(userId);

            if (response == null)
            {
                return NotFound(new { message = "common:internal_server_error" });
            }

            return Ok(response);
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetMyTickets()
        {
            var userId = GetCurrentUserId();

            var tickets = await _meService.GetMyTicketsAsync(userId);

            if (tickets == null)
            {
                return NotFound(new { message = "common:internal_server_error" });
            }

            return Ok(tickets);
        }
    }
}
