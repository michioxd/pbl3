using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;
using Pbl3.Services.Admin;

namespace Pbl3.Controllers.Admin
{
    [Authorize(Roles = "SysAdmin")]
    [Route("api/admin/system/reviews")]
    [ApiController]
    public class ReviewManagementController(
        IReviewManagementService reviewService,
        ICurrentUserContext currentUserContext
    ) : ControllerBase
    {
        private readonly IReviewManagementService _reviewService = reviewService;
        private readonly ICurrentUserContext _currentUserContext = currentUserContext;

        [HttpGet]
        public async Task<IActionResult> GetReviews(
            [FromQuery] string? q,
            [FromQuery] List<string>? statuses,
            [FromQuery] int? minRating,
            [FromQuery] int? maxRating,
            [FromQuery] bool? flaggedOnly,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortDirection,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            try
            {
                var result = await _reviewService.GetReviewsAsync(
                    q,
                    statuses,
                    minRating,
                    maxRating,
                    flaggedOnly,
                    startDate,
                    endDate,
                    sortBy,
                    sortDirection,
                    page,
                    pageSize
                );
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{reviewId:guid}")]
        public async Task<IActionResult> GetReviewDetail(Guid reviewId)
        {
            try
            {
                var result = await _reviewService.GetReviewDetailAsync(reviewId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost("{reviewId:guid}/approve")]
        public async Task<IActionResult> ApproveReview(Guid reviewId)
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                await _reviewService.ApproveReviewAsync(reviewId, userId);
                return Ok(new { message = "Đã duyệt đánh giá." });
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

        [HttpPost("{reviewId:guid}/reject")]
        public async Task<IActionResult> RejectReview(
            Guid reviewId,
            [FromBody] ModerateReviewDto dto
        )
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                await _reviewService.RejectReviewAsync(reviewId, dto, userId);
                return Ok(new { message = "Đã từ chối đánh giá." });
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

        [HttpPost("{reviewId:guid}/flag")]
        public async Task<IActionResult> FlagReview(
            Guid reviewId,
            [FromBody] ModerateReviewDto dto
        )
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                await _reviewService.FlagReviewAsync(reviewId, dto, userId);
                return Ok(new { message = "Đã gắn cờ đánh giá." });
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

        [HttpPost("{reviewId:guid}/unflag")]
        public async Task<IActionResult> UnflagReview(Guid reviewId)
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                await _reviewService.UnflagReviewAsync(reviewId, userId);
                return Ok(new { message = "Đã bỏ cờ đánh giá." });
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
