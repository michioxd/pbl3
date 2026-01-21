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

    public enum SeatStatus
    {
        Available,
        Locked,
        Booked
    }

    public enum TicketStatus
    {
        Pending,
        Confirmed,
        Cancelled
    }
}