using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Dtos
{
    // List item DTO for transaction history
    public class TransactionListItemDto
    {
        public Guid IntentID { get; set; }
        public Guid BookingID { get; set; }
        public PaymentProvider Provider { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "VND";
        public PaymentIntentStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }

        // Related booking info
        public string? ContactName { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public BookingStatus BookingStatus { get; set; }

        // Related user info (if authenticated booking)
        public Guid? UserID { get; set; }
        public string? UserEmail { get; set; }
        public string? UserFullName { get; set; }

        // Ticket count
        public int TicketCount { get; set; }

        // Refund info
        public bool HasRefund { get; set; }
        public decimal? RefundAmount { get; set; }
    }

    // Paginated response
    public class TransactionListResponseDto
    {
        public List<TransactionListItemDto> Records { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalRecords { get; set; }
        public int TotalPages { get; set; }
        public TransactionSummaryDto Summary { get; set; } = new();
    }

    // Summary statistics
    public class TransactionSummaryDto
    {
        public int TotalTransactions { get; set; }
        public decimal TotalAmount { get; set; }
        public int SucceededCount { get; set; }
        public decimal SucceededAmount { get; set; }
        public int FailedCount { get; set; }
        public int CreatedCount { get; set; }
        public int RefundedCount { get; set; }
        public decimal RefundedAmount { get; set; }

        // By provider
        public Dictionary<string, decimal> AmountByProvider { get; set; } = new();
    }

    // Detailed transaction view
    public class TransactionDetailDto
    {
        public Guid IntentID { get; set; }
        public Guid BookingID { get; set; }
        public PaymentProvider Provider { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "VND";
        public PaymentIntentStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }

        // Booking details
        public BookingDetailDto? Booking { get; set; }

        // Refunds
        public List<RefundDetailDto> Refunds { get; set; } = new();
    }

    public class BookingDetailDto
    {
        public Guid BookingID { get; set; }
        public string? ContactName { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public decimal TotalAmount { get; set; }
        public BookingStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }

        // User info (if authenticated booking)
        public Guid? UserID { get; set; }
        public string? UserEmail { get; set; }
        public string? UserFullName { get; set; }

        // Tickets
        public List<TicketDetailDto> Tickets { get; set; } = new();
    }

    public class TicketDetailDto
    {
        public Guid TicketID { get; set; }
        public string TicketCode { get; set; } = string.Empty;
        public decimal FinalPrice { get; set; }
        public TicketStatus Status { get; set; }

        // Passenger
        public string? PassengerFullName { get; set; }
        public string? PassengerPhone { get; set; }
        public string? PassengerIdentityCard { get; set; }

        // Trip info
        public string? TripRouteName { get; set; }
        public DateTime TripDepartureTime { get; set; }
        public string? TripDepartureLocation { get; set; }
        public string? TripArrivalLocation { get; set; }

        // Seat
        public string? SeatName { get; set; }
    }

    public class RefundDetailDto
    {
        public Guid RefundID { get; set; }
        public decimal Amount { get; set; }
        public string? Reason { get; set; }
        public RefundStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
