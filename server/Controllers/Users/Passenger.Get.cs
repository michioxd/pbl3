using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Pbl3.Controllers.Users
{
    public partial class PassengersController
    {
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
                    t.TicketCode,
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
