namespace Pbl3.Enums
{
    public enum UserRole
    {
        Passenger,
        BusAdmin,
        SysAdmin,
    }

    public enum BusCompanyPermission
    {
        RouteManagement,
        TicketManagement,
        BusManagement,
        StaffManagement,
        PromotionManagement,
        FinanceManagement,
    }

    public enum BusAdminUpgradeRequestStatus
    {
        Pending,
        Approved,
        Rejected,
    }

    public enum CompanyProfileUpdateRequestStatus
    {
        Pending,
        Approved,
        Rejected,
    }

    public enum CompanyStatus
    {
        Pending, 
        Approved,
        Suspended, 
        Rejected,
    }

    public enum TripStatus
    {
        Scheduled,
        Running,
        Completed,
        Cancelled,
    }

    public enum SeatType
    {
        Window,
        Aisle,
        Middle,
        Driver,
        UpperDeck,
        LowerDeck,
    }

    public enum StationType
    {
        BusStation,
        Office,
        PickUpPoint,
    }

    public enum BookingStatus
    {
        Pending,
        Paid,
        Cancelled,
        Refunded,
    }

    public enum TicketStatus
    {
        PendingPayment,
        Issued,
        CheckedIn,
        Cancelled,
    }

    public enum SeatHoldStatus
    {
        Held,
        Confirmed,
        Expired,
    }

    public enum PaymentProvider
    {
        Momo,
        Stripe,
        Cash,
    }

    public enum PaymentIntentStatus
    {
        Created,
        Succeeded,
        Failed,
    }

    public enum RefundStatus
    {
        Pending, // Initial request
        Processed, // Old: kept for compatibility
        Approved, // SysAdmin approved
        Processing, // Being processed by payment provider
        Completed, // Successfully refunded
        Rejected, // SysAdmin rejected
        Failed, // Provider failed to process
    }

    public enum ReviewStatus
    {
        Pending = 0, // Awaiting SysAdmin moderation
        Approved = 1, // Published and visible to public
        Rejected = 2, // Declined by admin
        Flagged = 3, // Flagged for policy violations
    }

    public enum NotificationType
    {
        Email,
        SMS,
        Push,
    }

    public enum NotificationStatus
    {
        Sent,
        Failed,
    }
}
