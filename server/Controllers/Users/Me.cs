using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/user/me")]
    [Authorize(Policy = "UserOnly")]
    public class UserMeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserMeController(ApplicationDbContext context)
        {
            _context = context;
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

        [HttpGet]
        public async Task<IActionResult> GetDetails()
        {
            var userId = GetCurrentUserId();

            var passenger = await _context
                .Passengers.AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserID == userId);

            if (passenger == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ hành khách." });

            var user = await _context
                .Users.AsNoTracking()
                .Include(u => u.Role)
                .Where(u => u.UserID == userId)
                .Select(u => new
                {
                    u.UserID,
                    u.Email,
                    u.FullName,
                    u.PhoneNumber,
                    u.IsActive,
                    u.CreatedAt,
                    role = u.Role == null ? null : new { u.Role.RoleID, u.Role.RoleName },
                })
                .FirstOrDefaultAsync();

            return Ok(
                new
                {
                    passenger = new
                    {
                        passenger.PassengerID,
                        passenger.FullName,
                        passenger.Email,
                        passenger.PhoneNumber,
                    },
                    user,
                }
            );
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetMyTickets()
        {
            var userId = GetCurrentUserId();

            var passenger = await _context.Passengers.FirstOrDefaultAsync(p => p.UserID == userId);
            if (passenger == null)
                return NotFound(new { message = "common:internal_server_error" });

            var tickets = await _context
                .Tickets.Include(t => t.Trip)
                    .ThenInclude(tr => tr!.Route)
                .Include(t => t.SeatLayout)
                .Where(t => t.PassengerID == passenger.PassengerID)
                .Select(t => new
                {
                    t.TicketID,
                    SeatLabel = t.SeatLayout != null ? t.SeatLayout.SeatLabel : null,
                    Price = t.FinalPrice,
                    t.Status,
                    RouteName = t.Trip != null && t.Trip.Route != null
                        ? t.Trip.Route.RouteName
                        : null,
                    DepartureTime = t.Trip != null ? t.Trip.DepartureTime : default,
                })
                .ToListAsync();

            return Ok(tickets);
        }
    }
}
