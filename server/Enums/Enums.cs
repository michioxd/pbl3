namespace Pbl3.Enums
{
    public enum UserRole
    {
        Passenger,
        BusAdmin,
        SysAdmin
    }

    public enum TripStatus
    {
        Scheduled,
        Running,
        Completed,
        Cancelled
    }

    public enum SeatType
    {
        Window,
        Aisle,
        Middle,
        Driver,
        UpperDeck,
        LowerDeck
    }

    public enum StationType
    {
        BusStation,
        Office,
        PickUpPoint
    }

    public enum CalendarExceptionType
    {
        Added,
        Removed
    }

    public enum BookingStatus
    {
        Pending,
        Paid,
        Cancelled,
        Refunded
    }

    public enum TicketStatus
    {
        Issued,
        CheckedIn,
        Cancelled
    }

    public enum SeatHoldStatus
    {
        Held,
        Confirmed,
        Expired
    }

    public enum PaymentProvider
    {
        Momo,
        Stripe,
        Cash
    }

    public enum PaymentIntentStatus
    {
        Created,
        Succeeded,
        Failed
    }

    public enum PaymentChargeStatus
    {
        Captured,
        Failed
    }

    public enum RefundStatus
    {
        Pending,
        Processed
    }

    public enum NotificationType
    {
        Email,
        SMS,
        Push
    }

    public enum NotificationStatus
    {
        Sent,
        Failed
    }
}
