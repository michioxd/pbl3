using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Admin
{
    [Authorize(Roles = "SysAdmin")]
    [Route("api/admin/system/reviews")]
    [ApiController]
    public class ReviewManagementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewManagementController(ApplicationDbContext context)
        {
            _context = context;
        }

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
            if (page < 1)
                return BadRequest(new { message = "page >= 1" });
            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
                return BadRequest(new { message = "pageSize: 25, 50, 100, 200" });

            var query = _context
                .Reviews.AsNoTracking()
                .Include(r => r.Trip)
                    .ThenInclude(t => t!.Route)
                        .ThenInclude(r => r!.BusCompany)
                .Include(r => r.Booking)
                .AsQueryable();

            // Search filter
            if (!string.IsNullOrWhiteSpace(q))
            {
                var keyword = $"%{q.Trim()}%";
                query = query.Where(r =>
                    (r.Comment != null && EF.Functions.ILike(r.Comment, keyword))
                    || EF.Functions.ILike(r.Booking!.ContactName, keyword)
                    || EF.Functions.ILike(r.Booking!.ContactEmail, keyword)
                );
            }

            // Status filter
            if (statuses != null && statuses.Count > 0)
            {
                var statusEnums = statuses
                    .SelectMany(s => s.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    .Select(s => Enum.Parse<ReviewStatus>(s, true))
                    .ToHashSet();
                query = query.Where(r => statusEnums.Contains(r.Status));
            }

            // Rating filter
            if (minRating.HasValue)
                query = query.Where(r => r.RatingScore >= minRating.Value);
            if (maxRating.HasValue)
                query = query.Where(r => r.RatingScore <= maxRating.Value);

            // Flagged filter
            if (flaggedOnly.HasValue && flaggedOnly.Value)
                query = query.Where(r => r.IsFlagged);

            // Date filter
            if (startDate.HasValue)
                query = query.Where(r => r.CreatedAt >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(r => r.CreatedAt <= endDate.Value.AddDays(1));

            // Sorting
            query = (sortBy ?? "").ToLowerInvariant() switch
            {
                "rating" => sortDirection == "asc"
                    ? query.OrderBy(r => r.RatingScore)
                    : query.OrderByDescending(r => r.RatingScore),
                "status" => sortDirection == "asc"
                    ? query.OrderBy(r => r.Status)
                    : query.OrderByDescending(r => r.Status),
                _ => query.OrderByDescending(r => r.CreatedAt),
            };

            var filteredCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(filteredCount / (double)pageSize);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new ReviewListItemDto
                {
                    ReviewID = r.ReviewID,
                    RatingScore = r.RatingScore,
                    Comment = r.Comment,
                    Status = (int)r.Status,
                    IsFlagged = r.IsFlagged,
                    CreatedAt = r.CreatedAt,
                    TripRoute = r.Trip!.Route!.RouteName,
                    CompanyName = r.Trip!.Route!.BusCompany!.Name,
                    TripDepartureTime = r.Trip!.DepartureTime,
                    BookingContactName = r.Booking!.ContactName,
                    BookingContactEmail = r.Booking!.ContactEmail,
                })
                .ToListAsync();

            // Summary
            var allReviews = await _context.Reviews.AsNoTracking().ToListAsync();
            var summary = new ReviewSummaryDto
            {
                TotalReviews = allReviews.Count,
                PendingCount = allReviews.Count(r => r.Status == ReviewStatus.Pending),
                ApprovedCount = allReviews.Count(r => r.Status == ReviewStatus.Approved),
                RejectedCount = allReviews.Count(r => r.Status == ReviewStatus.Rejected),
                FlaggedCount = allReviews.Count(r => r.IsFlagged),
                AverageRating = allReviews.Count > 0 ? allReviews.Average(r => r.RatingScore) : 0,
            };

            return Ok(
                new ReviewsListResponseDto
                {
                    Items = items,
                    TotalCount = allReviews.Count,
                    FilteredCount = filteredCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = totalPages,
                    Summary = summary,
                }
            );
        }

        [HttpGet("{reviewId:guid}")]
        public async Task<IActionResult> GetReviewDetail(Guid reviewId)
        {
            var review = await _context
                .Reviews.AsNoTracking()
                .Include(r => r.Trip)
                    .ThenInclude(t => t!.Route)
                        .ThenInclude(r => r!.BusCompany)
                .Include(r => r.Booking)
                .Include(r => r.ModeratedByUser)
                .FirstOrDefaultAsync(r => r.ReviewID == reviewId);

            if (review == null)
                return NotFound(new { message = "Không tìm thấy đánh giá." });

            var dto = new ReviewDetailDto
            {
                ReviewID = review.ReviewID,
                RatingScore = review.RatingScore,
                Comment = review.Comment,
                Status = (int)review.Status,
                IsFlagged = review.IsFlagged,
                CreatedAt = review.CreatedAt,
                ModeratedAt = review.ModeratedAt,
                ModerationReason = review.ModerationReason,
                TripID = review.TripID,
                TripRoute = review.Trip!.Route!.RouteName,
                CompanyName = review.Trip.Route!.BusCompany!.Name,
                TripDepartureTime = review.Trip.DepartureTime,
                TripArrivalTime = review.Trip.ArrivalTime,
                BookingID = review.BookingID,
                BookingContactName = review.Booking!.ContactName,
                BookingContactEmail = review.Booking.ContactEmail,
                BookingContactPhone = review.Booking.ContactPhone,
                ModeratedByUserEmail = review.ModeratedByUser?.Email,
            };

            return Ok(dto);
        }

        [HttpPost("{reviewId:guid}/approve")]
        public async Task<IActionResult> ApproveReview(Guid reviewId)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.ReviewID == reviewId);

            if (review == null)
                return NotFound(new { message = "Không tìm thấy đánh giá." });

            if (review.Status != ReviewStatus.Pending)
                return BadRequest(new { message = "Chỉ có thể duyệt đánh giá đang chờ xử lý." });

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            review.Status = ReviewStatus.Approved;
            review.ModeratedAt = DateTime.UtcNow;
            review.ModeratedByUserID = userId;
            review.ModerationReason = null;
            review.IsFlagged = false;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã duyệt đánh giá." });
        }

        [HttpPost("{reviewId:guid}/reject")]
        public async Task<IActionResult> RejectReview(
            Guid reviewId,
            [FromBody] ModerateReviewDto dto
        )
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.ReviewID == reviewId);

            if (review == null)
                return NotFound(new { message = "Không tìm thấy đánh giá." });

            if (review.Status != ReviewStatus.Pending)
                return BadRequest(new { message = "Chỉ có thể từ chối đánh giá đang chờ xử lý." });

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            review.Status = ReviewStatus.Rejected;
            review.ModeratedAt = DateTime.UtcNow;
            review.ModeratedByUserID = userId;
            review.ModerationReason = dto.ModerationReason;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã từ chối đánh giá." });
        }

        [HttpPost("{reviewId:guid}/flag")]
        public async Task<IActionResult> FlagReview(Guid reviewId, [FromBody] ModerateReviewDto dto)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.ReviewID == reviewId);

            if (review == null)
                return NotFound(new { message = "Không tìm thấy đánh giá." });

            if (review.Status != ReviewStatus.Approved)
                return BadRequest(new { message = "Chỉ có thể gắn cờ đánh giá đã được duyệt." });

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            review.Status = ReviewStatus.Flagged;
            review.IsFlagged = true;
            review.ModeratedAt = DateTime.UtcNow;
            review.ModeratedByUserID = userId;
            review.ModerationReason = dto.ModerationReason;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã gắn cờ đánh giá." });
        }

        [HttpPost("{reviewId:guid}/unflag")]
        public async Task<IActionResult> UnflagReview(Guid reviewId)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.ReviewID == reviewId);

            if (review == null)
                return NotFound(new { message = "Không tìm thấy đánh giá." });

            if (review.Status != ReviewStatus.Flagged)
                return BadRequest(new { message = "Chỉ có thể bỏ cờ đánh giá đã được gắn cờ." });

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            review.Status = ReviewStatus.Approved;
            review.IsFlagged = false;
            review.ModeratedAt = DateTime.UtcNow;
            review.ModeratedByUserID = userId;
            review.ModerationReason = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã bỏ cờ đánh giá." });
        }
    }
}
