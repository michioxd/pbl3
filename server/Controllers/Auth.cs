using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IPasswordHasher<User> _passwordHasher;

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration,
            IPasswordHasher<User> passwordHasher
        )
        {
            _context = context;
            _configuration = configuration;
            _passwordHasher = passwordHasher;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var identifier = request.UsernameOrEmail.Trim();

            var user = await _context
                .Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Username == identifier || u.Email == identifier);

            if (user == null)
            {
                return Unauthorized(
                    new { message = "Tên đăng nhập/email hoặc mật khẩu không đúng." }
                );
            }

            if (!user.IsActive)
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new { message = "Tài khoản đã bị khóa." }
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
            {
                return Unauthorized(
                    new { message = "Tên đăng nhập/email hoặc mật khẩu không đúng." }
                );
            }

            if (
                verificationResult == PasswordVerificationResult.SuccessRehashNeeded
                || isLegacyPlainTextPassword
            )
            {
                user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
                await _context.SaveChangesAsync();
            }

            return Ok(CreateAuthResponse(user));
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            var username = request.Username.Trim();
            var email = request.Email.Trim().ToLowerInvariant();
            var fullName = request.FullName.Trim();
            var phoneNumber = NormalizeOptional(request.PhoneNumber);
            var identityCard = NormalizeOptional(request.IdentityCard);

            var usernameExists = await _context.Users.AnyAsync(u =>
                u.Username.ToLower() == username.ToLower()
            );
            if (usernameExists)
            {
                return Conflict(new { message = "Tên đăng nhập đã tồn tại." });
            }

            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
            if (emailExists)
            {
                return Conflict(new { message = "Email đã được sử dụng." });
            }

            var passengerRole = await _context.Roles.FirstOrDefaultAsync(r =>
                r.RoleName == UserRole.Passenger.ToString()
            );
            if (passengerRole == null)
            {
                return Problem("Không tìm thấy role Passenger trong hệ thống.");
            }

            var user = new User
            {
                UserID = Guid.NewGuid(),
                RoleID = passengerRole.RoleID,
                Role = passengerRole,
                Username = username,
                PasswordHash = string.Empty,
                Email = email,
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

            return StatusCode(StatusCodes.Status201Created, CreateAuthResponse(user));
        }

        private AuthResponseDto CreateAuthResponse(User user)
        {
            if (user.Role == null)
            {
                throw new InvalidOperationException(
                    "User role is required to generate an authentication response."
                );
            }

            var expiresAt = DateTime.UtcNow.AddDays(7);
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.UserID.ToString()),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new("email", user.Email),
                new("username", user.Username),
                new("role", user.Role.RoleName),
            };

            var jwtKey =
                Environment.GetEnvironmentVariable("JWT_KEY")
                ?? _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT key not found.");
            var jwtIssuer =
                Environment.GetEnvironmentVariable("JWT_ISSUER")
                ?? _configuration["Jwt:Issuer"]
                ?? throw new InvalidOperationException("JWT issuer not found.");
            var jwtAudience =
                Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                ?? _configuration["Jwt:Audience"]
                ?? throw new InvalidOperationException("JWT audience not found.");

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials
            );

            return new AuthResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                ExpiresAt = expiresAt,
                User = new UserDto
                {
                    Id = user.UserID,
                    Username = user.Username,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber ?? string.Empty,
                    Role = user.Role.RoleName,
                    IsActive = user.IsActive,
                },
            };
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }
}
