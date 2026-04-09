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
    [Route("api/auth")]
    public class AuthLegacyController(
        ApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        IPasswordHasher<User> passwordHasher
    ) : ControllerBase
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IJwtTokenService _jwtTokenService = jwtTokenService;
        private readonly IPasswordHasher<User> _passwordHasher = passwordHasher;

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            var email = request.Email.Trim().ToLowerInvariant();

            var user = await _context
                .Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

            if (user == null)
                return Unauthorized(new { message = "auth:msg.invalid_credentials" });

            if (string.IsNullOrEmpty(user.PasswordHash))
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new { message = "auth:msg.legacy_login_is_not_allowed" }
                );

            if (!user.IsActive)
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new { message = "auth:msg.account_is_banned" }
                );
            }

            var verificationResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password
            );
            var isLegacyPlainTextPassword =
                verificationResult == PasswordVerificationResult.Failed
                && string.Equals(user.PasswordHash, request.Password, StringComparison.Ordinal);

            if (
                verificationResult == PasswordVerificationResult.Failed
                && !isLegacyPlainTextPassword
            )
                return Unauthorized(new { message = "auth:msg.invalid_credentials" });

            if (
                verificationResult == PasswordVerificationResult.SuccessRehashNeeded
                || isLegacyPlainTextPassword
            )
            {
                user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
                await _context.SaveChangesAsync();
            }

            return Ok(_jwtTokenService.CreateAuthResponse(user));
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(
            [FromBody] RegisterRequestDto request
        )
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var fullName = request.FullName.Trim();
            var phoneNumber = NormalizeOptional(request.PhoneNumber);
            var identityCard = NormalizeOptional(request.IdentityCard);

            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
            if (emailExists)
                return Conflict(new { message = "auth:msg.email_already_in_use" });

            var passengerRole = await _context.Roles.FirstOrDefaultAsync(r =>
                r.RoleName == UserRole.Passenger.ToString()
            );
            if (passengerRole == null)
                return Problem("common:internal_server_error");

            var user = new User
            {
                UserID = Guid.NewGuid(),
                RoleID = passengerRole.RoleID,
                Role = passengerRole,
                PasswordHash = string.Empty,
                Email = email,
                FullName = fullName,
                PhoneNumber = phoneNumber,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

            var passenger = new Passenger
            {
                PassengerID = Guid.NewGuid(),
                UserID = user.UserID,
                FullName = fullName,
                PhoneNumber = phoneNumber,
                IdentityCard = identityCard,
                Email = email,
            };

            await using var transaction = await _context.Database.BeginTransactionAsync();

            _context.Users.Add(user);
            _context.Passengers.Add(passenger);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return StatusCode(
                StatusCodes.Status201Created,
                _jwtTokenService.CreateAuthResponse(user)
            );
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }
}
