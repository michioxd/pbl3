using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services
{
    public interface IBookingService
    {
        Task<(int StatusCode, string? ErrorMessage, BookingResponseDto? Data)> CreateBookingAsync(CreateBookingRequestDto request, Guid userId);
        Task<(int StatusCode, string? ErrorMessage, BookingResponseDto? Data)> GetBookingAsync(Guid bookingId, Guid userId);
        Task<(int StatusCode, string? ErrorMessage, BookingResponseDto? Data)> CancelBookingAsync(Guid bookingId, Guid userId);
    }

    public class BookingService(ApplicationDbContext context) : IBookingService
    {
        private readonly ApplicationDbContext _context = context;

        public async Task<(int StatusCode, string? ErrorMessage, BookingResponseDto? Data)> CreateBookingAsync(
            CreateBookingRequestDto request,
            Guid userId
        )
        {
            var trip = await _context
                .Trips.Include(t => t.Route)
                .Include(t => t.BusType)
                .FirstOrDefaultAsync(t => t.TripID == request.TripId);

            if (trip == null)
            {
                return (404, "Không tìm thấy chuyến xe.", null);
            }

            if (trip.Status != TripStatus.Scheduled)
            {
                return (400, "Chuyến xe hiện không khả dụng.", null);
            }

            var routeStops = await _context
                .RouteStops.AsNoTracking()
                .Where(stop => stop.RouteID == trip.RouteID)
                .Select(stop => new
                {
                    stop.StationID,
                    stop.StopOrder,
                    stop.IsPickUp,
                    stop.IsDropOff,
                })
                .ToListAsync();

            var pickupStop = routeStops.FirstOrDefault(stop =>
                stop.StationID == request.PickupStopId && stop.IsPickUp
            );
            if (pickupStop == null)
            {
                return (400, "Điểm đón không hợp lệ.", null);
            }

            var dropoffStop = routeStops.FirstOrDefault(stop =>
                stop.StationID == request.DropoffStopId && stop.IsDropOff
            );
            if (dropoffStop == null)
            {
                return (400, "Điểm trả không hợp lệ.", null);
            }

            if (pickupStop.StopOrder >= dropoffStop.StopOrder)
            {
                return (400, "Điểm đón phải đứng trước điểm trả.", null);
            }

            var passenger = await _context.Passengers.FirstOrDefaultAsync(p => p.UserID == userId);

            if (passenger == null)
            {
                return (404, "Không tìm thấy hồ sơ hành khách.", null);
            }

            var utcNow = DateTime.UtcNow;
            var unavailableSeatIds = await _context
                .Tickets.AsNoTracking()
                .Where(t => t.TripID == request.TripId && t.Status != TicketStatus.Cancelled)
                .Select(t => t.SeatLayoutID)
                .Concat(
                    _context
                        .SeatHolds.AsNoTracking()
                        .Where(h =>
                            h.TripID == request.TripId
                            && h.Status == SeatHoldStatus.Held
                            && h.ExpiresAt > utcNow
                        )
                        .Select(h => h.SeatLayoutID)
                )
                .Distinct()
                .ToListAsync();

            var seat = await _context
                .SeatLayouts.AsNoTracking()
                .Where(layout => layout.BusTypeID == trip.BusTypeID)
                .Where(layout => !unavailableSeatIds.Contains(layout.LayoutID))
                .OrderBy(layout => layout.Floor)
                .ThenBy(layout => layout.PositionY)
                .ThenBy(layout => layout.PositionX)
                .FirstOrDefaultAsync();

            if (seat == null)
            {
                return (400, "Chuyến xe đã hết chỗ trống.", null);
            }

            var booking = new Booking
            {
                BookingID = Guid.NewGuid(),
                UserID = userId,
                ContactName = request.ContactName.Trim(),
                ContactPhone = request.ContactPhone.Trim(),
                ContactEmail = request.ContactEmail.Trim(),
                TotalAmount = trip.BasePrice,
                Status =
                    request.PaymentProvider == PaymentProvider.Cash
                        ? BookingStatus.Pending
                        : BookingStatus.Pending,
                CreatedAt = utcNow,
                ExpiresAt =
                    request.PaymentProvider == PaymentProvider.Cash
                        ? utcNow.AddHours(12)
                        : utcNow.AddMinutes(15),
            };

            var ticket = new Ticket
            {
                TicketID = Guid.NewGuid(),
                BookingID = booking.BookingID,
                TripID = trip.TripID,
                PassengerID = passenger.PassengerID,
                SeatLayoutID = seat.LayoutID,
                FinalPrice = trip.BasePrice,
                Status = TicketStatus.Issued,
                TicketCode = GenerateTicketCode(trip.DepartureDate),
            };

            _context.Bookings.Add(booking);
            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            return await GetBookingAsync(booking.BookingID, userId);
        }

        public async Task<(int StatusCode, string? ErrorMessage, BookingResponseDto? Data)> GetBookingAsync(Guid bookingId, Guid userId)
        {
            var booking = await _context
                .Bookings.AsNoTracking()
                .Where(b => b.BookingID == bookingId && b.UserID == userId)
                .Select(b => new BookingResponseDto
                {
                    BookingId = b.BookingID,
                    TripId = b.Tickets.Select(t => t.TripID).FirstOrDefault(),
                    ContactName = b.ContactName,
                    ContactPhone = b.ContactPhone,
                    ContactEmail = b.ContactEmail,
                    TotalAmount = b.TotalAmount,
                    Status = b.Status,
                    CreatedAt = b.CreatedAt,
                    ExpiresAt = b.ExpiresAt,
                    PaymentIntentId = b
                        .PaymentIntents.OrderByDescending(pi => pi.CreatedAt)
                        .Select(pi => (Guid?)pi.IntentID)
                        .FirstOrDefault(),
                    PaymentProvider = b
                        .PaymentIntents.OrderByDescending(pi => pi.CreatedAt)
                        .Select(pi => (PaymentProvider?)pi.Provider)
                        .FirstOrDefault(),
                    PaymentStatus = b
                        .PaymentIntents.OrderByDescending(pi => pi.CreatedAt)
                        .Select(pi => (PaymentIntentStatus?)pi.Status)
                        .FirstOrDefault(),
                    RequiresOnlinePayment = b.Status == BookingStatus.Pending,
                    Tickets = b
                        .Tickets.OrderBy(t => t.SeatLayout!.Floor)
                        .ThenBy(t => t.SeatLayout!.PositionY)
                        .ThenBy(t => t.SeatLayout!.PositionX)
                        .Select(t => new BookingTicketDto
                        {
                            TicketId = t.TicketID,
                            TicketCode = t.TicketCode,
                            SeatLayoutId = t.SeatLayoutID,
                            SeatLabel =
                                t.SeatLayout != null ? t.SeatLayout.SeatLabel : string.Empty,
                            FinalPrice = t.FinalPrice,
                            Status = t.Status,
                            PassengerFullName =
                                t.Passenger != null ? t.Passenger.FullName : string.Empty,
                            DepartureTime = t.Trip != null ? t.Trip.DepartureTime : default,
                            ArrivalTime = t.Trip != null ? t.Trip.ArrivalTime : default,
                            RouteName =
                                t.Trip != null && t.Trip.Route != null
                                    ? t.Trip.Route.RouteName
                                    : string.Empty,
                        })
                        .ToList(),
                })
                .FirstOrDefaultAsync();

            if (booking == null)
            {
                return (404, "Không tìm thấy booking.", null);
            }

            return (200, null, booking);
        }

        public async Task<(int StatusCode, string? ErrorMessage, BookingResponseDto? Data)> CancelBookingAsync(Guid bookingId, Guid userId)
        {
            var booking = await _context
                .Bookings.Include(b => b.Tickets)
                .FirstOrDefaultAsync(b => b.BookingID == bookingId && b.UserID == userId);

            if (booking == null)
            {
                return (404, "Không tìm thấy booking.", null);
            }

            if (booking.Status == BookingStatus.Paid)
            {
                return (400, "Không thể hủy booking đã thanh toán.", null);
            }

            if (booking.Status == BookingStatus.Cancelled)
            {
                return await GetBookingAsync(bookingId, userId);
            }

            booking.Status = BookingStatus.Cancelled;
            booking.ExpiresAt = null;

            foreach (var ticket in booking.Tickets)
            {
                ticket.Status = TicketStatus.Cancelled;
            }

            await _context.SaveChangesAsync();

            return await GetBookingAsync(bookingId, userId);
        }

        private static string GenerateTicketCode(DateOnly departureDate)
        {
            return $"TKT-{departureDate:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
        }
    }
}
