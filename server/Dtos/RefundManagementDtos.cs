using System.ComponentModel.DataAnnotations;

namespace Pbl3.Dtos
{
    public class RefundRequestListItemDto
    {
        public Guid RefundRequestID { get; set; }
        public Guid BookingID { get; set; }
        public decimal RequestedAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public int Status { get; set; }
        public DateTime RequestedAt { get; set; }
        public string ContactName { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string? TripRoute { get; set; }
        public string? CompanyName { get; set; }
    }

    public class RefundRequestDetailDto
    {
        public Guid RefundRequestID { get; set; }
        public Guid BookingID { get; set; }
        public Guid PaymentIntentID { get; set; }
        public decimal RequestedAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public int Status { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string? AdminNotes { get; set; }
        public string? ProcessedByUserEmail { get; set; }
    }

    public class RefundRequestSummaryDto
    {
        public int TotalRequests { get; set; }
        public int PendingCount { get; set; }
        public int ApprovedCount { get; set; }
        public int RejectedCount { get; set; }
        public decimal PendingAmount { get; set; }
        public decimal ApprovedAmount { get; set; }
    }

    public class RefundRequestsListResponseDto
    {
        public List<RefundRequestListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int FilteredCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public RefundRequestSummaryDto Summary { get; set; } = new();
    }

    public class ProcessRefundRequestDto
    {
        [Required]
        public required string AdminNotes { get; set; }
    }

    public class CreateRefundRequestDto
    {
        [Required]
        public Guid BookingID { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(500)]
        public required string Reason { get; set; }
    }
}
