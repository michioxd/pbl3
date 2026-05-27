using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using System;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Users
{
    public partial class PassengersController
    {
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetCurrentUserId();
            var result = await _passengersService.GetProfileAsync(userId);
            return Ok(result);
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetMyTickets()
        {
            var userId = GetCurrentUserId();
            var result = await _passengersService.GetMyTicketsAsync(userId);
            return Ok(result);
        }

        [HttpPost("tickets/{ticketId:guid}/refund")]
        public async Task<IActionResult> CreateTicketRefundRequest(
            Guid ticketId,
            [FromBody] CreateRefundRequestDto dto
        )
        {
            var userId = GetCurrentUserId();
            var refundRequestId = await _passengersService.CreateTicketRefundRequestAsync(ticketId, dto, userId);
            return Ok(new { refundRequestId });
        }
    }
}
