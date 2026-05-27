using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;

namespace Pbl3.Controllers
{
    [ApiController]
    [Route("api/trips")]
    [Tags("Trips")]
    public class TripDetailController(
        ITripDetailService tripDetailService,
        ICurrentUserContext currentUserContext
    ) : ControllerBase
    {
        private readonly ITripDetailService _tripDetailService = tripDetailService;
        private readonly ICurrentUserContext _currentUserContext = currentUserContext;

        [HttpGet("{tripId:guid}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(TripDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTripDetail(Guid tripId)
        {
            try
            {
                var result = await _tripDetailService.GetTripDetailAsync(tripId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("{tripId:guid}/seats")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(List<TripSeatDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTripSeats(Guid tripId)
        {
            try
            {
                var result = await _tripDetailService.GetTripSeatsAsync(tripId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("{tripId:guid}/reviews")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(TripReviewsResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTripReviews(Guid tripId)
        {
            try
            {
                var result = await _tripDetailService.GetTripReviewsAsync(tripId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost("/api/reviews")]
        [Authorize(Policy = "UserOnly")]
        [ProducesResponseType(typeof(CreateReviewResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                var result = await _tripDetailService.CreateReviewAsync(dto, userId);
                return Created($"/api/reviews/{result.ReviewId}", result);
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
