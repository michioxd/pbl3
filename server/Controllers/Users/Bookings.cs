using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/bookings")]
    [Authorize(Policy = "UserOnly")]
    [Tags("Bookings")]
    public class BookingsController(
        IBookingService bookingService,
        ICurrentUserContext currentUserContext
    ) : ControllerBase
    {
        private readonly IBookingService _bookingService = bookingService;
        private readonly ICurrentUserContext _currentUserContext = currentUserContext;

        [HttpPost]
        [ProducesResponseType(typeof(BookingResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequestDto dto)
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                var result = await _bookingService.CreateBookingAsync(dto, userId);
                return CreatedAtAction(
                    nameof(GetBooking),
                    new { bookingId = result.BookingId },
                    result
                );
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{bookingId:guid}")]
        [ProducesResponseType(typeof(BookingResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetBooking(Guid bookingId)
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                var result = await _bookingService.GetBookingAsync(bookingId, userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("{bookingId:guid}/cancel")]
        [ProducesResponseType(typeof(BookingResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CancelBooking(Guid bookingId)
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                var result = await _bookingService.CancelBookingAsync(bookingId, userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
