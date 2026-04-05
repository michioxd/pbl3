using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Enums;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/passenger")]
    [Authorize(Policy = "UserOnly")]
    public class PassengersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PassengersController(ApplicationDbContext context)
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

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetCurrentUserId();

            var passenger = await _context
                .Passengers.Include(p => p.User)
                .Where(p => p.UserID == userId)
                .Select(p => new
                {
                    p.PassengerID,
                    p.FullName,
                    p.Email,
                    p.PhoneNumber,
                    p.IdentityCard,
                    Username = p.User != null ? p.User.Username : null,
                })
                .FirstOrDefaultAsync();

            if (passenger == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ hành khách." });

            return Ok(passenger);
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetMyTickets()
        {
            var userId = GetCurrentUserId();

            var passenger = await _context.Passengers.FirstOrDefaultAsync(p => p.UserID == userId);
            if (passenger == null)
                return NotFound(new { message = "Hành khách không tồn tại." });

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

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdatePassengerDto dto)
        {
            var userId = GetCurrentUserId();

            var passenger = await _context
                .Passengers.Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserID == userId);

            if (passenger == null)
                return NotFound();

            passenger.FullName = dto.FullName;
            passenger.PhoneNumber = dto.PhoneNumber;
            passenger.IdentityCard = dto.IdentityCard;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công." });
        }
    }

    public class UpdatePassengerDto
    {
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? IdentityCard { get; set; }
    }
}
