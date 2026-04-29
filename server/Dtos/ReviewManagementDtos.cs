using Pbl3.Enums;

namespace Pbl3.Dtos
{
    // For list view
    public class ReviewListItemDto
    {
        public Guid ReviewID { get; set; }
        public int RatingScore { get; set; }
        public string? Comment { get; set; }
        public int Status { get; set; }
        public bool IsFlagged { get; set; }
        public DateTime CreatedAt { get; set; }

        // Trip/Company info
        public string TripRoute { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public DateTime TripDepartureTime { get; set; }

        // Booking/Reviewer info
        public string BookingContactName { get; set; } = string.Empty;
        public string BookingContactEmail { get; set; } = string.Empty;
    }

    // For detail view
    public class ReviewDetailDto
    {
        public Guid ReviewID { get; set; }
        public int RatingScore { get; set; }
        public string? Comment { get; set; }
        public int Status { get; set; }
        public bool IsFlagged { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ModeratedAt { get; set; }
        public string? ModerationReason { get; set; }

        // Full trip details
        public Guid TripID { get; set; }
        public string TripRoute { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public DateTime TripDepartureTime { get; set; }
        public DateTime TripArrivalTime { get; set; }

        // Booking details
        public Guid BookingID { get; set; }
        public string BookingContactName { get; set; } = string.Empty;
        public string BookingContactEmail { get; set; } = string.Empty;
        public string BookingContactPhone { get; set; } = string.Empty;

        // Moderator info
        public string? ModeratedByUserEmail { get; set; }
    }

    // Summary for dashboard cards
    public class ReviewSummaryDto
    {
        public int TotalReviews { get; set; }
        public int PendingCount { get; set; }
        public int ApprovedCount { get; set; }
        public int RejectedCount { get; set; }
        public int FlaggedCount { get; set; }
        public double AverageRating { get; set; }
    }

    // Paginated list response
    public class ReviewsListResponseDto
    {
        public List<ReviewListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int FilteredCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public ReviewSummaryDto Summary { get; set; } = new();
    }

    // For moderation actions
    public class ModerateReviewDto
    {
        public required string ModerationReason { get; set; }
    }
}
