using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Controllers.Users
{
    public partial class PassengersController
    {
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _passengerService.GetProfileAsync(userId);

            if (result.StatusCode == 200)
                return Ok(result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetMyTickets()
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _passengerService.GetMyTicketsAsync(userId);

            if (result.StatusCode == 200)
                return Ok(result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPost("tickets/{ticketId:guid}/refund")]
        public async Task<IActionResult> CreateTicketRefundRequest(
            Guid ticketId,
            [FromBody] CreateRefundRequestDto dto
        )
        {
            var userId = GetCurrentUserId();

            var passenger = await _context.Passengers.FirstOrDefaultAsync(p => p.UserID == userId);
            if (passenger == null)
                return NotFound(new { message = "Hành khách không tồn tại." });

            var ticket = await _context
                .Tickets.Include(t => t.Trip)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.PaymentIntents)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.RefundRequests)
                .FirstOrDefaultAsync(t =>
                    t.TicketID == ticketId && t.PassengerID == passenger.PassengerID
                );

            if (ticket == null)
                return NotFound(new { message = "Không tìm thấy vé." });

            if (ticket.Booking == null)
                return BadRequest(new { message = "Vé chưa liên kết booking." });

            if (dto.BookingID != ticket.BookingID)
                return BadRequest(new { message = "Booking hoàn tiền không khớp với vé." });

            if (ticket.Status != TicketStatus.Issued)
                return BadRequest(new { message = "Chỉ có thể hoàn tiền vé đã xác nhận." });

            if (ticket.Booking.Status != BookingStatus.Paid)
                return BadRequest(new { message = "Booking chưa được thanh toán." });

            if (ticket.Trip != null && ticket.Trip.DepartureTime <= DateTime.UtcNow)
                return BadRequest(new { message = "Không thể hoàn tiền vé đã đến giờ khởi hành." });

            if (
                ticket.Booking.RefundRequests.Any(rr =>
                    rr.Status == RefundStatus.Pending
                    || rr.Status == RefundStatus.Approved
                    || rr.Status == RefundStatus.Processing
                    || rr.Status == RefundStatus.Completed
                )
            )
            {
                return BadRequest(new { message = "Booking này đã có yêu cầu hoàn tiền." });
            }

            var successfulPayment = ticket.Booking.PaymentIntents.FirstOrDefault(pi =>
                pi.Status == PaymentIntentStatus.Succeeded
            );

            if (successfulPayment == null)
                return BadRequest(new { message = "Booking chưa được thanh toán." });

            var amount = ticket.FinalPrice;
            if (dto.Amount > 0 && dto.Amount < ticket.FinalPrice)
            {
                amount = dto.Amount;
            }

            var request = new RefundRequest
            {
                BookingID = ticket.BookingID,
                PaymentIntentID = successfulPayment.IntentID,
                UserID = userId,
                RequestedAmount = amount,
                Reason = dto.Reason,
                Status = RefundStatus.Pending,
            };

            _context.RefundRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new { refundRequestId = request.RefundRequestID });
        }
    }
}
