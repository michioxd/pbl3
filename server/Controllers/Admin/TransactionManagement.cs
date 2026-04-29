using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system/transactions")]
    [Authorize(Policy = "AdminOnly")]
    [Tags("SystemAdmin")]
    public class TransactionManagement : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TransactionManagement(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactions(
            [FromQuery] PaymentProvider? provider,
            [FromQuery] PaymentIntentStatus? status,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

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
                // Include entire end date
                var endOfDay = endDate.Value.Date.AddDays(1);
                query = query.Where(p => p.CreatedAt < endOfDay);
            }

            // Search by booking ID, contact email, or user email
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(
                    p =>
                        p.BookingID.ToString().ToLower().Contains(searchLower)
                        || (p.Booking != null && p.Booking.ContactEmail != null && p.Booking.ContactEmail.ToLower().Contains(searchLower))
                        || (p.Booking != null && p.Booking.User != null && p.Booking.User.Email.ToLower().Contains(searchLower))
                );
            }

            var totalRecords = await query.CountAsync();
            var totalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

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
                    UserEmail = p.Booking != null && p.Booking.User != null ? p.Booking.User.Email : null,
                    UserFullName =
                        p.Booking != null && p.Booking.User != null ? p.Booking.User.FullName : null,
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
                SucceededCount = allTransactions.Count(p => p.Status == PaymentIntentStatus.Succeeded),
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

            return Ok(
                new TransactionListResponseDto
                {
                    Records = transactions,
                    Page = page,
                    PageSize = pageSize,
                    TotalRecords = totalRecords,
                    TotalPages = totalPages,
                    Summary = summary,
                }
            );
        }

        private Guid GetCurrentUserId()
        {
            var userIdString =
                User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userIdString, out Guid userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("Không tìm thấy UserID trong token.");
        }
    }
}
