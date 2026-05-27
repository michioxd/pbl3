using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Services.Users;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/passenger")]
    [Authorize(Policy = "UserOnly")]
    [Tags("Passenger")]
    public partial class PassengersController : ControllerBase
    {
        private readonly IPassengersService _passengersService;

        public PassengersController(IPassengersService passengersService)
        {
            _passengersService = passengersService;
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
    }
}
