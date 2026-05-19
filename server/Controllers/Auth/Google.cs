using Google.Apis.Auth;
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
    [Route("api/auth/oauth/google")]
    public class AuthGoogleController(IAuthService authService) : ControllerBase
    {
        private readonly IAuthService _authService = authService;

        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult<AuthResponseDto>> GoogleLogin(
            [FromBody] OAuthGoogleRequestDto request
        )
        {
            var result = await _authService.GoogleLoginAsync(request);

            if (result.StatusCode == 200)
                return Ok(result.Data);

            if (result.StatusCode == 201)
                return StatusCode(201, result.Data);

            if (result.StatusCode == 400)
                return BadRequest(new { message = result.ErrorMessage });

            if (result.StatusCode == 401)
                return Unauthorized(new { message = result.ErrorMessage });

            if (result.StatusCode == 500)
                return StatusCode(500, new { message = result.ErrorMessage });

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }
    }
}
