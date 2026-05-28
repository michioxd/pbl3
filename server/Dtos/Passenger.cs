using System;
using System.ComponentModel.DataAnnotations;

namespace Pbl3.Dtos
{
    public class UpdatePassengerDto
    {
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? IdentityCard { get; set; }
    }

    public class CreateBusAdminUpgradeRequestDto
    {
        [Required]
        [StringLength(200, MinimumLength = 2)]
        public string CompanyName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? LicenseNumber { get; set; }

        [Phone]
        public string? Hotline { get; set; }

        [StringLength(1000)]
        public string? Reason { get; set; }
    }

    public class BusAdminUpgradeRequestResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public Guid RequestId { get; set; }
        public Enums.BusAdminUpgradeRequestStatus Status { get; set; }
        public DateTime RequestedAt { get; set; }
    }

    public class PassengerProfileDto
    {
        public Guid PassengerID { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? IdentityCard { get; set; }
    }

    public class PassengerTicketDetailDto
    {
        public Guid TicketID { get; set; }
        public Guid BookingID { get; set; }
        public Guid TripID { get; set; }
        public string TicketCode { get; set; } = string.Empty;
        public string? SeatLabel { get; set; }
        public int? SeatFloor { get; set; }
        public string? SeatType { get; set; }
        public decimal Price { get; set; }
        public Enums.TicketStatus Status { get; set; }
        public string? RouteName { get; set; }
        public string? CompanyName { get; set; }
        public decimal? DistanceEstimate { get; set; }
        public decimal? DurationEstimate { get; set; }
        public DateOnly DepartureDate { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public string? TripStatus { get; set; }
        public string? CancellationPolicy { get; set; }
        public string? TripNotes { get; set; }
        public string? PlateNumber { get; set; }
        public string? BusTypeName { get; set; }
        public string? ContactName { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactEmail { get; set; }
        public string? BookingStatus { get; set; }
        public DateTime BookingCreatedAt { get; set; }
        public string? PaymentStatus { get; set; }
        public string? PaymentProvider { get; set; }
        public DateTime? PaidAt { get; set; }
        public bool CanRefund { get; set; }
        public string? RefundStatus { get; set; }
    }
}
