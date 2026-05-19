using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services
{
    public interface IAuthService
    {
        Task<(int StatusCode, string? ErrorMessage, AuthResponseDto? Data)> LegacyLoginAsync(LoginRequestDto request);
        Task<(int StatusCode, string? ErrorMessage, AuthResponseDto? Data)> RegisterAsync(RegisterRequestDto request);
        Task<(int StatusCode, string? ErrorMessage, AuthResponseDto? Data)> GoogleLoginAsync(OAuthGoogleRequestDto request);
    }

    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IPasswordHasher<User> _passwordHasher;

        public AuthService(
            ApplicationDbContext context,
            IJwtTokenService jwtTokenService,
            IPasswordHasher<User> passwordHasher)
        {
            _context = context;
            _jwtTokenService = jwtTokenService;
            _passwordHasher = passwordHasher;
        }

        public async Task<(int StatusCode, string? ErrorMessage, AuthResponseDto? Data)> LegacyLoginAsync(LoginRequestDto request)
        {
            var email = request.Email.Trim().ToLowerInvariant();

            var user = await _context
                .Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

            if (user == null)
                return (401, "auth:msg.invalid_credentials", null);

            if (string.IsNullOrEmpty(user.PasswordHash))
                return (403, "auth:msg.legacy_login_is_not_allowed", null);

            if (!user.IsActive)
                return (403, "auth:msg.account_is_banned", null);

            var verificationResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password
            );
            var isLegacyPlainTextPassword =
                verificationResult == PasswordVerificationResult.Failed
                && string.Equals(user.PasswordHash, request.Password, StringComparison.Ordinal);

            if (verificationResult == PasswordVerificationResult.Failed && !isLegacyPlainTextPassword)
                return (401, "auth:msg.invalid_credentials", null);

            if (verificationResult == PasswordVerificationResult.SuccessRehashNeeded || isLegacyPlainTextPassword)
            {
                user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
                await _context.SaveChangesAsync();
            }

            return (200, null, _jwtTokenService.CreateAuthResponse(user));
        }

        public async Task<(int StatusCode, string? ErrorMessage, AuthResponseDto? Data)> RegisterAsync(RegisterRequestDto request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var fullName = request.FullName.Trim();
            var phoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
            var identityCard = string.IsNullOrWhiteSpace(request.IdentityCard) ? null : request.IdentityCard.Trim();

            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
            if (emailExists)
                return (409, "auth:msg.email_already_in_use", null);

            var passengerRole = await _context.Roles.FirstOrDefaultAsync(r =>
                r.RoleName == UserRole.Passenger.ToString()
            );
            if (passengerRole == null)
                return (500, "common:internal_server_error", null);

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

            return (201, null, _jwtTokenService.CreateAuthResponse(user));
        }

        public async Task<(int StatusCode, string? ErrorMessage, AuthResponseDto? Data)> GoogleLoginAsync(OAuthGoogleRequestDto request)
        {
            if (string.IsNullOrEmpty(request.IdToken))
                return (400, "IdToken is required.", null);

            var googleClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");

            if (string.IsNullOrEmpty(googleClientId))
                return (500, "common:internal_server_error", null);

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
                        return (500, "common:internal_server_error", null);

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

                    return (201, null, _jwtTokenService.CreateAuthResponse(newUser));
                }

                if (!user.IsActive)
                    return (401, "auth:msg.account_is_banned", null);

                return (200, null, _jwtTokenService.CreateAuthResponse(user));
            }
            catch (InvalidJwtException)
            {
                return (401, "auth:msg.google_login_failed", null);
            }
        }
    }
}
