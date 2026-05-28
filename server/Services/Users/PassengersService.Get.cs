using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services.Users
{
    public partial class PassengersService
    {
        public async Task<PassengerProfileDto> GetProfileAsync(Guid userId)
        {
            var passenger = await _context
                .Passengers.Include(p => p.User)
                .Where(p => p.UserID == userId)
                .Select(p => new PassengerProfileDto
                {
                    PassengerID = p.PassengerID,
                    FullName = p.FullName,
                    Email = p.Email,
                    PhoneNumber = p.PhoneNumber,
                    IdentityCard = p.IdentityCard,
                })
                .FirstOrDefaultAsync();

            if (passenger == null)
            {
                throw new KeyNotFoundException("Không tìm thấy hồ sơ hành khách.");
            }

            return passenger;
        }

        public async Task<List<PassengerTicketDetailDto>> GetMyTicketsAsync(Guid userId)
        {
            var passengerExists = await _context.Passengers.AnyAsync(p => p.UserID == userId);
            if (!passengerExists)
            {
                throw new KeyNotFoundException("Hành khách không tồn tại.");
            }

            var tickets = await _context
                .Tickets
                .Where(t => t.Passenger != null && t.Passenger.UserID == userId)
                .Select(t => new PassengerTicketDetailDto
                {
                    TicketID = t.TicketID,
                    BookingID = t.BookingID,
                    TripID = t.TripID,
                    TicketCode = t.TicketCode,
                    SeatLabel = t.SeatLayout != null ? t.SeatLayout.SeatLabel : null,
                    SeatFloor = t.SeatLayout != null ? (int?)t.SeatLayout.Floor : null,
                    SeatType = t.SeatLayout != null ? t.SeatLayout.SeatType.ToString() : null,
                    Price = t.FinalPrice,
                    Status = t.Status,
                    RouteName = t.Trip != null && t.Trip.Route != null ? t.Trip.Route.RouteName : null,
                    CompanyName = t.Trip != null && t.Trip.Route != null && t.Trip.Route.BusCompany != null ? t.Trip.Route.BusCompany.Name : null,
                    DistanceEstimate = t.Trip != null && t.Trip.Route != null ? (decimal?)t.Trip.Route.DistanceEstimate : null,
                    DurationEstimate = t.Trip != null && t.Trip.Route != null ? (decimal?)t.Trip.Route.DurationEstimate : null,
                    DepartureDate = t.Trip != null ? t.Trip.DepartureDate : default,
                    DepartureTime = t.Trip != null ? t.Trip.DepartureTime : default,
                    ArrivalTime = t.Trip != null ? t.Trip.ArrivalTime : default,
                    TripStatus = t.Trip != null ? t.Trip.Status.ToString() : null,
                    CancellationPolicy = t.Trip != null ? t.Trip.CancellationPolicy : null,
                    TripNotes = t.Trip != null ? t.Trip.Notes : null,
                    PlateNumber = t.Trip != null && t.Trip.Bus != null ? t.Trip.Bus.PlateNumber : null,
                    BusTypeName = t.Trip != null && t.Trip.Bus != null && t.Trip.Bus.BusType != null ? t.Trip.Bus.BusType.Name : (t.Trip != null && t.Trip.BusType != null ? t.Trip.BusType.Name : null),
                    ContactName = t.Booking != null ? t.Booking.ContactName : null,
                    ContactPhone = t.Booking != null ? t.Booking.ContactPhone : null,
                    ContactEmail = t.Booking != null ? t.Booking.ContactEmail : null,
                    BookingStatus = t.Booking != null ? t.Booking.Status.ToString() : null,
                    BookingCreatedAt = t.Booking != null ? t.Booking.CreatedAt : default,
                    PaymentStatus = t.Booking != null ? t.Booking.PaymentIntents
                        .Where(pi => pi.Status == PaymentIntentStatus.Succeeded)
                        .Select(pi => pi.Status.ToString())
                        .FirstOrDefault() : null,
                    PaymentProvider = t.Booking != null ? t.Booking.PaymentIntents
                        .Where(pi => pi.Status == PaymentIntentStatus.Succeeded)
                        .Select(pi => pi.Provider.ToString())
                        .FirstOrDefault() : null,
                    PaidAt = t.Booking != null ? t.Booking.PaymentIntents
                        .Where(pi => pi.Status == PaymentIntentStatus.Succeeded)
                        .Select(pi => pi.PaidAt)
                        .FirstOrDefault() : null,
                    CanRefund = t.Status == TicketStatus.Issued
                        && t.Booking != null
                        && t.Booking.Status == BookingStatus.Paid
                        && t.Trip != null
                        && t.Trip.DepartureTime > DateTime.UtcNow
                        && !t.Booking.RefundRequests.Any(rr =>
                            rr.Status == RefundStatus.Pending
                            || rr.Status == RefundStatus.Approved
                            || rr.Status == RefundStatus.Processing
                            || rr.Status == RefundStatus.Completed
                        ),
                    RefundStatus = t.Booking != null ? t.Booking.RefundRequests
                        .OrderByDescending(rr => rr.RequestedAt)
                        .Select(rr => rr.Status.ToString())
                        .FirstOrDefault() : null,
                })
                .OrderByDescending(t => t.DepartureTime)
                .ToListAsync();

            return tickets;
        }

        public async Task<Guid> CreateTicketRefundRequestAsync(Guid ticketId, CreateRefundRequestDto dto, Guid userId)
        {
            var passengerExists = await _context.Passengers.AnyAsync(p => p.UserID == userId);
            if (!passengerExists)
            {
                throw new KeyNotFoundException("Hành khách không tồn tại.");
            }

            var ticket = await _context
                .Tickets.Include(t => t.Trip)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.PaymentIntents)
                .Include(t => t.Booking)
                    .ThenInclude(b => b!.RefundRequests)
                .FirstOrDefaultAsync(t =>
                    t.TicketID == ticketId && t.Passenger != null && t.Passenger.UserID == userId
                );

            if (ticket == null)
            {
                throw new KeyNotFoundException("Không tìm thấy vé.");
            }

            if (ticket.Booking == null)
            {
                throw new ArgumentException("Vé chưa liên kết booking.");
            }

            if (dto.BookingID != ticket.BookingID)
            {
                throw new ArgumentException("Booking hoàn tiền không khớp với vé.");
            }

            if (ticket.Status != TicketStatus.Issued)
            {
                throw new ArgumentException("Chỉ có thể hoàn tiền vé đã xác nhận.");
            }

            if (ticket.Booking.Status != BookingStatus.Paid)
            {
                throw new ArgumentException("Booking chưa được thanh toán.");
            }

            if (ticket.Trip != null && ticket.Trip.DepartureTime <= DateTime.UtcNow)
            {
                throw new ArgumentException("Không thể hoàn tiền vé đã đến giờ khởi hành.");
            }

            if (
                ticket.Booking.RefundRequests.Any(rr =>
                    rr.Status == RefundStatus.Pending
                    || rr.Status == RefundStatus.Approved
                    || rr.Status == RefundStatus.Processing
                    || rr.Status == RefundStatus.Completed
                )
            )
            {
                throw new ArgumentException("Booking này đã có yêu cầu hoàn tiền.");
            }

            var successfulPayment = ticket.Booking.PaymentIntents.FirstOrDefault(pi =>
                pi.Status == PaymentIntentStatus.Succeeded
            );

            if (successfulPayment == null)
            {
                throw new ArgumentException("Booking chưa được thanh toán.");
            }

            var amount = ticket.FinalPrice;
            if (dto.Amount > 0 && dto.Amount < ticket.FinalPrice)
            {
                amount = dto.Amount;
            }

            var request = new RefundRequest
            {
                BookingID = ticket.BookingID,
                PaymentIntentID = successfulPayment.IntentID,
                UserID = userId,
                RequestedAmount = amount,
                Reason = dto.Reason,
                Status = RefundStatus.Pending,
            };

            _context.RefundRequests.Add(request);
            await _context.SaveChangesAsync();

            return request.RefundRequestID;
        }
    }
}
