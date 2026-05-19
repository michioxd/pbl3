using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;
using Pbl3.Services;

namespace Pbl3.Controllers.Auth
{
    [ApiController]
    [Route("api/auth")]
    public class AuthLegacyController(IAuthService authService) : ControllerBase
    {
        private readonly IAuthService _authService = authService;

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            var result = await _authService.LegacyLoginAsync(request);

            if (result.StatusCode == 200)
                return Ok(result.Data);
            
            if (result.StatusCode == 401)
                return Unauthorized(new { message = result.ErrorMessage });

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(
            [FromBody] RegisterRequestDto request
        )
        {
            var result = await _authService.RegisterAsync(request);

            if (result.StatusCode == 201)
                return StatusCode(201, result.Data);

            if (result.StatusCode == 409)
                return Conflict(new { message = result.ErrorMessage });

            if (result.StatusCode == 500)
                return Problem(result.ErrorMessage);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }
    }
}
