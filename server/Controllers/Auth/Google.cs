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
    [Tags("Authentication")]
    [ApiController]
    [Route("api/auth/oauth/google")]
    public class AuthGoogleController(
        ApplicationDbContext context,
        IJwtTokenService jwtTokenService
    ) : ControllerBase
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IJwtTokenService _jwtTokenService = jwtTokenService;

        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult<AuthResponseDto>> GoogleLogin(
            [FromBody] OAuthGoogleRequestDto request
        )
        {
            if (string.IsNullOrEmpty(request.IdToken))
                return BadRequest(new { message = "IdToken is required." });

            var googleClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");

            if (string.IsNullOrEmpty(googleClientId))
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "common:internal_server_error" }
                );

            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new List<string>() { googleClientId },
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);

                string email = payload.Email;
                string name = payload.Name;

                var user = await _context
                    .Users.Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

                if (user == null)
                {
                    var passengerRole = await _context.Roles.FirstOrDefaultAsync(r =>
                        r.RoleName == UserRole.Passenger.ToString()
                    );
                    if (passengerRole == null)
                        return Problem("common:internal_server_error");

                    var newUser = new User
                    {
                        UserID = Guid.NewGuid(),
                        RoleID = passengerRole.RoleID,
                        Role = passengerRole,
                        PasswordHash = string.Empty,
                        Email = email,
                        FullName = name,
                        PhoneNumber = string.Empty,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                    };

                    newUser.PasswordHash = "";

                    var passenger = new Passenger
                    {
                        PassengerID = Guid.NewGuid(),
                        UserID = newUser.UserID,
                        FullName = name,
                        PhoneNumber = string.Empty,
                        IdentityCard = string.Empty,
                        Email = email,
                    };

                    await using var transaction = await _context.Database.BeginTransactionAsync();

                    _context.Users.Add(newUser);
                    _context.Passengers.Add(passenger);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return StatusCode(
                        StatusCodes.Status201Created,
                        _jwtTokenService.CreateAuthResponse(newUser)
                    );
                }

                if (!user.IsActive)
                    return Unauthorized(new { message = "auth:msg.account_is_banned" });

                return Ok(_jwtTokenService.CreateAuthResponse(user));
            }
            catch (InvalidJwtException)
            {
                return Unauthorized(new { message = "auth:msg.google_login_failed" });
            }
        }
    }
}
