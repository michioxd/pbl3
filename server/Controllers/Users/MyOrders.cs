using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Services;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/user/me/orders")]
    [Authorize(Policy = "UserOnly")]
    [Tags("User")]
    public class UserMyOrdersController : ControllerBase
    {
        private readonly IMyOrdersService _myOrdersService;

        public UserMyOrdersController(IMyOrdersService myOrdersService)
        {
            _myOrdersService = myOrdersService;
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
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetCurrentUserId();

            var response = await _myOrdersService.GetMyOrdersAsync(userId);

            if (response == null)
            {
                return NotFound(new { message = "common:internal_server_error" });
            }

            return Ok(response);
        }
    }
}
