using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Dtos
{
    public class CreateBookingRequestDto
    {
        [Required]
        public Guid TripId { get; set; }

        [Required]
        [MaxLength(200)]
        public string ContactName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string ContactPhone { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(200)]
        public string ContactEmail { get; set; } = string.Empty;

        [Required]
        public Guid PickupStopId { get; set; }

        [Required]
        public Guid DropoffStopId { get; set; }

        [MaxLength(1000)]
        public string? AddressNote { get; set; }

        public PaymentProvider PaymentProvider { get; set; }
    }

    public class BookingTicketDto
    {
        public Guid TicketId { get; set; }

        public string TicketCode { get; set; } = string.Empty;

        public Guid SeatLayoutId { get; set; }

        public string SeatLabel { get; set; } = string.Empty;

        public decimal FinalPrice { get; set; }

        public TicketStatus Status { get; set; }

        public string PassengerFullName { get; set; } = string.Empty;

        public DateTime DepartureTime { get; set; }

        public DateTime ArrivalTime { get; set; }

        public string RouteName { get; set; } = string.Empty;
    }

    public class BookingResponseDto
    {
        public Guid BookingId { get; set; }

        public Guid TripId { get; set; }

        public string ContactName { get; set; } = string.Empty;

        public string ContactPhone { get; set; } = string.Empty;

        public string ContactEmail { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public BookingStatus Status { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? ExpiresAt { get; set; }

        public Guid? PaymentIntentId { get; set; }

        public PaymentProvider? PaymentProvider { get; set; }

        public PaymentIntentStatus? PaymentStatus { get; set; }

        public bool RequiresOnlinePayment { get; set; }

        public List<BookingTicketDto> Tickets { get; set; } = new();
    }
}
