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
            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _bookingService.CreateBookingAsync(dto, userId);

            if (result.StatusCode == 200 || result.StatusCode == 201)
                return CreatedAtAction(
                    nameof(GetBooking),
                    new { bookingId = result.Data!.BookingId },
                    result.Data
                );

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("{bookingId:guid}")]
        [ProducesResponseType(typeof(BookingResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetBooking(Guid bookingId)
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _bookingService.GetBookingAsync(bookingId, userId);

            if (result.StatusCode == 200)
                return Ok(result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPut("{bookingId:guid}/cancel")]
        [ProducesResponseType(typeof(BookingResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CancelBooking(Guid bookingId)
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _bookingService.CancelBookingAsync(bookingId, userId);

            if (result.StatusCode == 200)
                return Ok(result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }
    }
}
