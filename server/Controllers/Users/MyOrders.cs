using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/user/me/orders")]
    [Authorize(Policy = "UserOnly")]
    [Tags("User")]
    public class UserMyOrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserMyOrdersController(ApplicationDbContext context)
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

            throw new UnauthorizedAccessException("common:internal_server_error");
        }

        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetCurrentUserId();

            var passengerId = await _context
                .Passengers.AsNoTracking()
                .Where(p => p.UserID == userId)
                .Select(p => p.PassengerID)
                .FirstOrDefaultAsync();

            if (passengerId == Guid.Empty)
            {
                return NotFound(new { message = "common:internal_server_error" });
            }

            var now = DateTime.UtcNow;

            var tickets = await _context
                .Tickets.AsNoTracking()
                .Where(t => t.PassengerID == passengerId)
                .Select(t => new OrderTicketDto
                {
                    TicketID = t.TicketID,
                    TicketCode = t.TicketCode,
                    Status = t.Status.ToString(),
                    FinalPrice = t.FinalPrice,
                    SeatLabel = t.SeatLayout != null ? t.SeatLayout.SeatLabel : null,
                    RouteName =
                        t.Trip != null && t.Trip.Route != null ? t.Trip.Route.RouteName : null,
                    DepartureTime = t.Trip != null ? t.Trip.DepartureTime : default,
                })
                .ToListAsync();

            var response = new MyOrdersResponseDto
            {
                Booked = tickets
                    .Where(t =>
                        t.Status == nameof(TicketStatus.PendingPayment)
                        || t.Status == nameof(TicketStatus.Issued)
                    )
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
                Completed = tickets
                    .Where(t =>
                        t.Status == nameof(TicketStatus.CheckedIn)
                        || (
                            t.Status == nameof(TicketStatus.Issued) && t.DepartureTime <= now
                        )
                    )
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
                Cancelled = tickets
                    .Where(t => t.Status == nameof(TicketStatus.Cancelled))
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
            };

            return Ok(response);
        }
    }
}
