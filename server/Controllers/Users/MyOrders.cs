using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Services;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/user/me/orders")]
    [Authorize(Policy = "UserOnly")]
    [Tags("User")]
    public class UserMyOrdersController : ControllerBase
    {
        private readonly IMyOrdersService _myOrdersService;

        public UserMyOrdersController(IMyOrdersService myOrdersService)
        {
            _myOrdersService = myOrdersService;
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

            var response = await _myOrdersService.GetMyOrdersAsync(userId);

            if (response == null)
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
                    //.Where(t => t.Status == "Issued" && t.DepartureTime > now)
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
                Completed = tickets
                    .Where(t =>
                        t.Status == "CheckedIn" || (t.Status == "Issued" && t.DepartureTime <= now)
                    )
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
                Cancelled = tickets
                    .Where(t => t.Status == "Cancelled")
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
            };

            return Ok(response);
        }
    }
}
