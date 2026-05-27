using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services.Admin
{
    public class TransactionManagementService(ApplicationDbContext context) : ITransactionManagementService
    {
        private readonly ApplicationDbContext _context = context;

        public async Task<TransactionListResponseDto> GetTransactionsAsync(
            PaymentProvider? provider,
            PaymentIntentStatus? status,
            DateTime? startDate,
            DateTime? endDate,
            string? search,
            int page,
            int pageSize
        )
        {
            if (page < 1)
                throw new ArgumentException("page phải lớn hơn hoặc bằng 1.");

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
                throw new ArgumentException("pageSize chỉ chấp nhận: 25, 50, 100, 200.");

            var query = _context
                .PaymentIntents.AsNoTracking()
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.User)
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Tickets)
                .Include(p => p.Refunds)
                .AsQueryable();

            // Apply filters
            if (provider.HasValue)
            {
                query = query.Where(p => p.Provider == provider.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(p => p.Status == status.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(p => p.CreatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                var endOfDay = endDate.Value.Date.AddDays(1);
                query = query.Where(p => p.CreatedAt < endOfDay);
            }

            // Search by booking ID, contact email, or user email
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(p =>
                    p.BookingID.ToString().ToLower().Contains(searchLower)
                    || (
                        p.Booking != null
                        && p.Booking.ContactEmail != null
                        && p.Booking.ContactEmail.ToLower().Contains(searchLower)
                    )
                    || (
                        p.Booking != null
                        && p.Booking.User != null
                        && p.Booking.User.Email.ToLower().Contains(searchLower)
                    )
                );
            }

            var totalRecords = await query.CountAsync();
            var totalPages =
                totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

            var transactions = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new TransactionListItemDto
                {
                    IntentID = p.IntentID,
                    BookingID = p.BookingID,
                    Provider = p.Provider,
                    Amount = p.Amount,
                    Currency = p.Currency,
                    Status = p.Status,
                    CreatedAt = p.CreatedAt,
                    ContactName = p.Booking != null ? p.Booking.ContactName : null,
                    ContactEmail = p.Booking != null ? p.Booking.ContactEmail : null,
                    ContactPhone = p.Booking != null ? p.Booking.ContactPhone : null,
                    BookingStatus = p.Booking != null ? p.Booking.Status : BookingStatus.Cancelled,
                    UserID = p.Booking != null ? p.Booking.UserID : null,
                    UserEmail =
                        p.Booking != null && p.Booking.User != null ? p.Booking.User.Email : null,
                    UserFullName =
                        p.Booking != null && p.Booking.User != null
                            ? p.Booking.User.FullName
                            : null,
                    TicketCount = p.Booking != null ? p.Booking.Tickets.Count : 0,
                    HasRefund = p.Refunds.Any(),
                    RefundAmount = p.Refunds.Any() ? p.Refunds.Sum(r => r.Amount) : null,
                })
                .ToListAsync();

            // Calculate summary
            var allTransactions = await _context.PaymentIntents.AsNoTracking().ToListAsync();

            var summary = new TransactionSummaryDto
            {
                TotalTransactions = allTransactions.Count,
                TotalAmount = allTransactions.Sum(p => p.Amount),
                SucceededCount = allTransactions.Count(p =>
                    p.Status == PaymentIntentStatus.Succeeded
                ),
                SucceededAmount = allTransactions
                    .Where(p => p.Status == PaymentIntentStatus.Succeeded)
                    .Sum(p => p.Amount),
                FailedCount = allTransactions.Count(p => p.Status == PaymentIntentStatus.Failed),
                CreatedCount = allTransactions.Count(p => p.Status == PaymentIntentStatus.Created),
                RefundedCount = await _context.Refunds.CountAsync(),
                RefundedAmount = await _context.Refunds.SumAsync(r => r.Amount),
                AmountByProvider = allTransactions
                    .Where(p => p.Status == PaymentIntentStatus.Succeeded)
                    .GroupBy(p => p.Provider.ToString())
                    .ToDictionary(g => g.Key, g => g.Sum(p => p.Amount)),
            };

            return new TransactionListResponseDto
            {
                Records = transactions,
                Page = page,
                PageSize = pageSize,
                TotalRecords = totalRecords,
                TotalPages = totalPages,
                Summary = summary,
            };
        }

        public async Task<TransactionDetailDto> GetTransactionDetailAsync(Guid intentId)
        {
            var paymentIntent = await _context
                .PaymentIntents.AsNoTracking()
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.User)
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Tickets)
                        .ThenInclude(t => t.Passenger)
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Tickets)
                        .ThenInclude(t => t.Trip)
                            .ThenInclude(tr => tr!.Route)
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Tickets)
                        .ThenInclude(t => t.SeatLayout)
                .Include(p => p.Refunds)
                .FirstOrDefaultAsync(p => p.IntentID == intentId);

            if (paymentIntent == null)
                throw new KeyNotFoundException("Không tìm thấy giao dịch.");

            return new TransactionDetailDto
            {
                IntentID = paymentIntent.IntentID,
                BookingID = paymentIntent.BookingID,
                Provider = paymentIntent.Provider,
                Amount = paymentIntent.Amount,
                Currency = paymentIntent.Currency,
                Status = paymentIntent.Status,
                CreatedAt = paymentIntent.CreatedAt,
                Booking =
                    paymentIntent.Booking == null
                        ? null
                        : new BookingDetailDto
                        {
                            BookingID = paymentIntent.Booking.BookingID,
                            ContactName = paymentIntent.Booking.ContactName,
                            ContactEmail = paymentIntent.Booking.ContactEmail,
                            ContactPhone = paymentIntent.Booking.ContactPhone,
                            TotalAmount = paymentIntent.Booking.TotalAmount,
                            Status = paymentIntent.Booking.Status,
                            CreatedAt = paymentIntent.Booking.CreatedAt,
                            ExpiresAt = paymentIntent.Booking.ExpiresAt,
                            UserID = paymentIntent.Booking.UserID,
                            UserEmail = paymentIntent.Booking.User?.Email,
                            UserFullName = paymentIntent.Booking.User?.FullName,
                            Tickets = paymentIntent
                                .Booking.Tickets.Select(t => new TicketDetailDto
                                {
                                    TicketID = t.TicketID,
                                    TicketCode = t.TicketCode,
                                    FinalPrice = t.FinalPrice,
                                    Status = t.Status,
                                    PassengerFullName = t.Passenger?.FullName,
                                    PassengerPhone = t.Passenger?.PhoneNumber,
                                    PassengerIdentityCard = t.Passenger?.IdentityCard,
                                    TripRouteName = t.Trip?.Route?.RouteName,
                                    TripDepartureTime = t.Trip?.DepartureTime ?? default,
                                    TripDepartureLocation = null,
                                    TripArrivalLocation = null,
                                    SeatName = t.SeatLayout?.SeatLabel,
                                })
                                .ToList(),
                        },
                Refunds = paymentIntent
                    .Refunds.Select(r => new RefundDetailDto
                    {
                        RefundID = r.RefundID,
                        Amount = r.Amount,
                        Reason = r.Reason,
                        Status = r.Status,
                        CreatedAt = r.CreatedAt,
                    })
                    .OrderByDescending(r => r.CreatedAt)
                    .ToList(),
            };
        }
    }
}
