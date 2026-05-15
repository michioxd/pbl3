using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Pbl3.Dtos;
using Pbl3.Models;

namespace Pbl3.Services
{
    public interface IJwtTokenService
    {
        AuthResponseDto CreateAuthResponse(User user);
    }

    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public AuthResponseDto CreateAuthResponse(User user)
        {
            if (user.Role == null)
                throw new InvalidOperationException(
                    "User role is required to generate an authentication response."
                );

            var expiresAt = DateTime.UtcNow.AddDays(7);
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.UserID.ToString()),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new("email", user.Email),
                new("role", user.Role.RoleName),
            };

            var jwtKey = GetJwtSetting("JWT_KEY", "Jwt:Key", "JWT key not found.");
            var jwtIssuer = GetJwtSetting("JWT_ISSUER", "Jwt:Issuer", "JWT issuer not found.");
            var jwtAudience = GetJwtSetting(
                "JWT_AUDIENCE",
                "Jwt:Audience",
                "JWT audience not found."
            );

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
                    Email = user.Email,
                    FullName = user.FullName ?? string.Empty,
                    PhoneNumber = user.PhoneNumber ?? string.Empty,
                    Role = user.Role.RoleName,
                    IsActive = user.IsActive,
                },
            };
        }

        private string GetJwtSetting(
            string environmentKey,
            string configurationKey,
            string errorMessage
        )
        {
            return Environment.GetEnvironmentVariable(environmentKey)
                ?? _configuration[configurationKey]
                ?? throw new InvalidOperationException(errorMessage);
        }
    }
}
