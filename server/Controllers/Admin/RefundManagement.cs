using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;
using Pbl3.Services;

namespace Pbl3.Controllers.Admin
{
    [Authorize(Roles = "SysAdmin")]
    [Route("api/admin/system/refunds")]
    [ApiController]
    public class RefundManagementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserContext _currentUserContext;
        private readonly IPaymentService _paymentService;
        private readonly ILogger<RefundManagementController> _logger;

        public RefundManagementController(
            ApplicationDbContext context,
            ICurrentUserContext currentUserContext,
            IPaymentService paymentService,
            ILogger<RefundManagementController> logger
        )
        {
            _context = context;
            _currentUserContext = currentUserContext;
            _paymentService = paymentService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetRefundRequests(
            [FromQuery] string? q,
            [FromQuery] List<string>? statuses,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortDirection,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
                return BadRequest(new { message = "page >= 1" });
            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
                return BadRequest(new { message = "pageSize: 25, 50, 100, 200" });

            var query = _context
                .RefundRequests.AsNoTracking()
                .Include(rr => rr.Booking)
                    .ThenInclude(b => b!.Tickets)
                        .ThenInclude(t => t.Trip)
                            .ThenInclude(tr => tr!.Route)
                                .ThenInclude(r => r!.BusCompany)
                .AsQueryable();

            // Search filter
            if (!string.IsNullOrWhiteSpace(q))
            {
                var keyword = $"%{q.Trim()}%";
                query = query.Where(rr =>
                    EF.Functions.ILike(rr.Booking!.ContactName, keyword)
                    || EF.Functions.ILike(rr.Booking!.ContactEmail, keyword)
                    || EF.Functions.ILike(rr.Reason, keyword)
                );
            }

            // Status filter
            if (statuses != null && statuses.Count > 0)
            {
                var statusEnums = statuses
                    .SelectMany(s => s.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    .Select(s => Enum.Parse<RefundStatus>(s, true))
                    .ToHashSet();
                query = query.Where(rr => statusEnums.Contains(rr.Status));
            }

            // Date filter
            if (startDate.HasValue)
                query = query.Where(rr => rr.RequestedAt >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(rr => rr.RequestedAt <= endDate.Value.AddDays(1));

            // Sorting
            query = (sortBy ?? "").ToLowerInvariant() switch
            {
                "amount" => sortDirection == "asc"
                    ? query.OrderBy(rr => rr.RequestedAmount)
                    : query.OrderByDescending(rr => rr.RequestedAmount),
                "status" => sortDirection == "asc"
                    ? query.OrderBy(rr => rr.Status)
                    : query.OrderByDescending(rr => rr.Status),
                _ => query.OrderByDescending(rr => rr.RequestedAt),
            };

            var filteredCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(filteredCount / (double)pageSize);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(rr => new RefundRequestListItemDto
                {
                    RefundRequestID = rr.RefundRequestID,
                    BookingID = rr.BookingID,
                    RequestedAmount = rr.RequestedAmount,
                    Reason = rr.Reason,
                    Status = (int)rr.Status,
                    RequestedAt = rr.RequestedAt,
                    ContactName = rr.Booking!.ContactName,
                    ContactEmail = rr.Booking.ContactEmail,
                    ContactPhone = rr.Booking.ContactPhone,
                    TripRoute = rr.Booking.Tickets.FirstOrDefault()!.Trip!.Route!.RouteName,
                    CompanyName = rr
                        .Booking.Tickets.FirstOrDefault()!
                        .Trip!.Route!.BusCompany!.Name,
                })
                .ToListAsync();

            // Summary
            var allRequests = await _context.RefundRequests.AsNoTracking().ToListAsync();
            var summary = new RefundRequestSummaryDto
            {
                TotalRequests = allRequests.Count,
                PendingCount = allRequests.Count(r => r.Status == RefundStatus.Pending),
                ApprovedCount = allRequests.Count(r =>
                    r.Status == RefundStatus.Approved || r.Status == RefundStatus.Completed
                ),
                RejectedCount = allRequests.Count(r => r.Status == RefundStatus.Rejected),
                PendingAmount = allRequests
                    .Where(r => r.Status == RefundStatus.Pending)
                    .Sum(r => r.RequestedAmount),
                ApprovedAmount = allRequests
                    .Where(r =>
                        r.Status == RefundStatus.Approved || r.Status == RefundStatus.Completed
                    )
                    .Sum(r => r.RequestedAmount),
            };

            return Ok(
                new RefundRequestsListResponseDto
                {
                    Items = items,
                    TotalCount = allRequests.Count,
                    FilteredCount = filteredCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = totalPages,
                    Summary = summary,
                }
            );
        }

        [HttpGet("{refundRequestId:guid}")]
        public async Task<IActionResult> GetRefundRequestDetail(Guid refundRequestId)
        {
            var request = await _context
                .RefundRequests.AsNoTracking()
                .Include(rr => rr.Booking)
                    .ThenInclude(b => b!.Tickets)
                .Include(rr => rr.PaymentIntent)
                .Include(rr => rr.ProcessedByUser)
                .FirstOrDefaultAsync(rr => rr.RefundRequestID == refundRequestId);

            if (request == null)
                return NotFound(new { message = "Không tìm thấy yêu cầu hoàn tiền." });

            var dto = new RefundRequestDetailDto
            {
                RefundRequestID = request.RefundRequestID,
                BookingID = request.BookingID,
                PaymentIntentID = request.PaymentIntentID,
                RequestedAmount = request.RequestedAmount,
                Reason = request.Reason,
                Status = (int)request.Status,
                RequestedAt = request.RequestedAt,
                ProcessedAt = request.ProcessedAt,
                AdminNotes = request.AdminNotes,
                ProcessedByUserEmail = request.ProcessedByUser?.Email,
            };

            return Ok(dto);
        }

        [HttpPost("{refundRequestId:guid}/approve")]
        public async Task<IActionResult> ApproveRefund(
            Guid refundRequestId,
            [FromBody] ProcessRefundRequestDto dto
        )
        {
            var request = await _context
                .RefundRequests.Include(rr => rr.PaymentIntent)
                .FirstOrDefaultAsync(rr => rr.RefundRequestID == refundRequestId);

            if (request == null)
                return NotFound(new { message = "Không tìm thấy yêu cầu hoàn tiền." });

            if (request.Status != RefundStatus.Pending)
                return BadRequest(new { message = "Chỉ có thể duyệt yêu cầu đang chờ xử lý." });

            var userId = _currentUserContext.GetRequiredUserId();

            // Create actual refund record
            var refund = new Refund
            {
                IntentID = request.PaymentIntentID,
                Amount = request.RequestedAmount,
                Reason = request.Reason,
                Status = RefundStatus.Processing,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Refunds.Add(refund);

            // Persist approval — this must always succeed
            request.Status = RefundStatus.Approved;
            request.ProcessedAt = DateTime.UtcNow;
            request.ProcessedByUserID = userId;
            request.AdminNotes = dto.AdminNotes;
            request.RefundID = refund.RefundID;

            await _context.SaveChangesAsync();

            // Attempt to trigger payment provider refund — failures are non-fatal
            string? paymentProcessingWarning = null;
            try
            {
                await _paymentService.ProcessRefundAsync(refund.RefundID);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Payment provider refund processing failed for RefundID {RefundId}. Approval is saved; manual processing may be required.",
                    refund.RefundID
                );
                paymentProcessingWarning = $"Duyệt thành công nhưng không thể xử lý hoàn tiền tự động: {ex.Message}";
            }

            if (paymentProcessingWarning != null)
            {
                return Ok(new
                {
                    message = "Đã duyệt yêu cầu hoàn tiền.",
                    paymentProcessingWarning,
                });
            }

            return Ok(new { message = "Đã duyệt yêu cầu hoàn tiền." });
        }


        [HttpPost("{refundRequestId:guid}/reject")]
        public async Task<IActionResult> RejectRefund(
            Guid refundRequestId,
            [FromBody] ProcessRefundRequestDto dto
        )
        {
            var request = await _context.RefundRequests.FirstOrDefaultAsync(rr =>
                rr.RefundRequestID == refundRequestId
            );

            if (request == null)
                return NotFound(new { message = "Không tìm thấy yêu cầu hoàn tiền." });

            if (request.Status != RefundStatus.Pending)
                return BadRequest(new { message = "Chỉ có thể từ chối yêu cầu đang chờ xử lý." });

            var userId = _currentUserContext.GetRequiredUserId();

            request.Status = RefundStatus.Rejected;
            request.ProcessedAt = DateTime.UtcNow;
            request.ProcessedByUserID = userId;
            request.AdminNotes = dto.AdminNotes;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã từ chối yêu cầu hoàn tiền." });
        }

        [HttpPost]
        public async Task<IActionResult> CreateRefundRequest([FromBody] CreateRefundRequestDto dto)
        {
            var booking = await _context
                .Bookings.Include(b => b.PaymentIntents)
                .FirstOrDefaultAsync(b => b.BookingID == dto.BookingID);

            if (booking == null)
                return NotFound(new { message = "Không tìm thấy booking." });

            var successfulPayment = booking.PaymentIntents.FirstOrDefault(pi =>
                pi.Status == PaymentIntentStatus.Succeeded
            );

            if (successfulPayment == null)
                return BadRequest(new { message = "Booking chưa được thanh toán." });

            if (dto.Amount > successfulPayment.Amount)
                return BadRequest(new { message = "Số tiền hoàn vượt quá số tiền đã thanh toán." });

            var request = new RefundRequest
            {
                BookingID = dto.BookingID,
                PaymentIntentID = successfulPayment.IntentID,
                RequestedAmount = dto.Amount,
                Reason = dto.Reason,
                Status = RefundStatus.Pending,
            };

            _context.RefundRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new { refundRequestId = request.RefundRequestID });
        }
    }
}
