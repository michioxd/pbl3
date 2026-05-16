using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Pbl3.Configurations;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;
using Pbl3.Utils;

namespace Pbl3.Services
{
    public interface IPaymentService
    {
        Task<CreateMomoPaymentResponseDto> CreateMomoPaymentAsync(Guid bookingId, Guid userId);
        Task<PaymentStatusDto> GetPaymentStatusAsync(Guid intentId, Guid userId);
        Task HandleMomoIpnAsync(MomoIpnRequestDto request);
        Task<MomoReturnResultDto> HandleMomoReturnAsync(MomoIpnRequestDto request);
        Task ProcessRefundAsync(Guid refundId);
    }

    public class PaymentService : IPaymentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserContext _currentUserContext;
        private readonly HttpClient _httpClient;
        private readonly MomoOptions _momoOptions;

        public PaymentService(
            ApplicationDbContext context,
            ICurrentUserContext currentUserContext,
            HttpClient httpClient,
            IOptions<MomoOptions> momoOptions
        )
        {
            _context = context;
            _currentUserContext = currentUserContext;
            _httpClient = httpClient;
            _momoOptions = momoOptions.Value;
        }

        public async Task<CreateMomoPaymentResponseDto> CreateMomoPaymentAsync(
            Guid bookingId,
            Guid userId
        )
        {
            ValidateMomoOptions();

            var booking = await _context
                .Bookings.Include(b => b.PaymentIntents)
                .FirstOrDefaultAsync(b => b.BookingID == bookingId && b.UserID == userId);

            if (booking == null)
            {
                throw new KeyNotFoundException("Không tìm thấy booking.");
            }

            if (booking.Status == BookingStatus.Paid)
            {
                throw new InvalidOperationException("Booking này đã được thanh toán.");
            }

            if (booking.TotalAmount <= 0)
            {
                throw new InvalidOperationException("Số tiền thanh toán không hợp lệ.");
            }

            var existingSucceeded = booking.PaymentIntents.FirstOrDefault(pi =>
                pi.Provider == PaymentProvider.Momo && pi.Status == PaymentIntentStatus.Succeeded
            );
            if (existingSucceeded != null)
            {
                throw new InvalidOperationException("Booking này đã được thanh toán thành công.");
            }

            var intent = booking.PaymentIntents.FirstOrDefault(pi =>
                pi.Provider == PaymentProvider.Momo && pi.Status == PaymentIntentStatus.Created
            );

            var amount = decimal.Truncate(booking.TotalAmount);
            var requestId = Guid.NewGuid().ToString("N");
            var orderId =
                intent?.ProviderOrderId
                ?? $"{booking.BookingID:N}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
            var orderInfo = $"Thanh toan booking {booking.BookingID}";
            var extraData = string.Empty;
            var rawSignature =
                $"accessKey={_momoOptions.AccessKey}"
                + $"&amount={amount:0}"
                + $"&extraData={extraData}"
                + $"&ipnUrl={_momoOptions.IpnUrl}"
                + $"&orderId={orderId}"
                + $"&orderInfo={orderInfo}"
                + $"&partnerCode={_momoOptions.PartnerCode}"
                + $"&redirectUrl={_momoOptions.RedirectUrl}"
                + $"&requestId={requestId}"
                + $"&requestType={_momoOptions.RequestType}";

            var signature = MomoSignatureHelper.ComputeHmacSha256(
                _momoOptions.SecretKey,
                rawSignature
            );

            var requestBody = new
            {
                partnerCode = _momoOptions.PartnerCode,
                partnerName = _momoOptions.PartnerName,
                storeId = _momoOptions.StoreId,
                requestId,
                amount = ((long)amount).ToString(),
                orderId,
                orderInfo,
                redirectUrl = _momoOptions.RedirectUrl,
                ipnUrl = _momoOptions.IpnUrl,
                lang = _momoOptions.Lang,
                requestType = _momoOptions.RequestType,
                autoCapture = true,
                extraData,
                signature,
            };

            var response = await _httpClient.PostAsJsonAsync("/v2/gateway/api/create", requestBody);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Không thể tạo thanh toán MoMo: {content}");
            }

            var momoResponse = JsonSerializer.Deserialize<MomoCreateResponse>(
                content,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (momoResponse == null)
            {
                throw new InvalidOperationException("Phản hồi MoMo không hợp lệ.");
            }

            if (momoResponse.ResultCode != 0)
            {
                throw new InvalidOperationException(
                    string.IsNullOrWhiteSpace(momoResponse.Message)
                        ? "MoMo từ chối yêu cầu thanh toán."
                        : momoResponse.Message
                );
            }

            if (intent == null)
            {
                intent = new PaymentIntent
                {
                    BookingID = booking.BookingID,
                    Provider = PaymentProvider.Momo,
                    Amount = booking.TotalAmount,
                    Currency = "VND",
                    Status = PaymentIntentStatus.Created,
                    ProviderOrderId = orderId,
                    ProviderRequestId = requestId,
                    PayUrl = momoResponse.PayUrl,
                    QrCodeUrl = momoResponse.QrCodeUrl,
                    Deeplink = momoResponse.Deeplink,
                    ProviderMessage = momoResponse.Message,
                    ProviderResultCode = momoResponse.ResultCode,
                    CreatedAt = DateTime.UtcNow,
                };
                _context.PaymentIntents.Add(intent);
            }
            else
            {
                intent.ProviderRequestId = requestId;
                intent.PayUrl = momoResponse.PayUrl;
                intent.QrCodeUrl = momoResponse.QrCodeUrl;
                intent.Deeplink = momoResponse.Deeplink;
                intent.ProviderMessage = momoResponse.Message;
                intent.ProviderResultCode = momoResponse.ResultCode;
            }

            await _context.SaveChangesAsync();

            return new CreateMomoPaymentResponseDto
            {
                IntentId = intent.IntentID,
                BookingId = booking.BookingID,
                OrderId = orderId,
                RequestId = requestId,
                Amount = intent.Amount,
                Currency = intent.Currency,
                Status = intent.Status,
                PayUrl = intent.PayUrl ?? string.Empty,
                QrCodeUrl = intent.QrCodeUrl,
                Deeplink = intent.Deeplink,
                Message = intent.ProviderMessage,
            };
        }

        public async Task<PaymentStatusDto> GetPaymentStatusAsync(Guid intentId, Guid userId)
        {
            var intent = await _context
                .PaymentIntents.AsNoTracking()
                .Include(pi => pi.Booking)
                .FirstOrDefaultAsync(pi =>
                    pi.IntentID == intentId && pi.Booking != null && pi.Booking.UserID == userId
                );

            if (intent == null)
            {
                throw new KeyNotFoundException("Không tìm thấy giao dịch.");
            }

            return new PaymentStatusDto
            {
                IntentId = intent.IntentID,
                BookingId = intent.BookingID,
                Provider = intent.Provider,
                Status = intent.Status,
                BookingStatus = intent.Booking!.Status,
                Amount = intent.Amount,
                Currency = intent.Currency,
                PayUrl = intent.PayUrl,
                QrCodeUrl = intent.QrCodeUrl,
                Deeplink = intent.Deeplink,
                Message = intent.ProviderMessage,
                ProviderTransactionId = intent.ProviderTransactionId,
                CreatedAt = intent.CreatedAt,
                PaidAt = intent.PaidAt,
            };
        }

        public async Task HandleMomoIpnAsync(MomoIpnRequestDto request)
        {
            await ProcessMomoCallbackAsync(request);
        }

        public async Task<MomoReturnResultDto> HandleMomoReturnAsync(MomoIpnRequestDto request)
        {
            ValidateMomoOptions();

            try
            {
                var intent = await ProcessMomoCallbackAsync(request);
                return BuildReturnResult(intent, request.ResultCode, request.Message);
            }
            catch (Exception ex)
            {
                var intent = await FindIntentByOrderIdAsync(request.OrderId);
                var resultCode = request.ResultCode == 0 ? -1 : request.ResultCode;
                return BuildReturnResult(intent, resultCode, ex.Message);
            }
        }

        private async Task<PaymentIntent?> ProcessMomoCallbackAsync(MomoIpnRequestDto request)
        {
            ValidateMomoOptions();

            var rawSignature =
                $"accessKey={_momoOptions.AccessKey}"
                + $"&amount={request.Amount}"
                + $"&extraData={request.ExtraData}"
                + $"&message={request.Message}"
                + $"&orderId={request.OrderId}"
                + $"&orderInfo={request.OrderInfo}"
                + $"&orderType={request.OrderType}"
                + $"&partnerCode={request.PartnerCode}"
                + $"&payType={request.PayType}"
                + $"&requestId={request.RequestId}"
                + $"&responseTime={request.ResponseTime}"
                + $"&resultCode={request.ResultCode}"
                + $"&transId={request.TransId}";

            var expectedSignature = MomoSignatureHelper.ComputeHmacSha256(
                _momoOptions.SecretKey,
                rawSignature
            );
            if (
                !string.Equals(
                    expectedSignature,
                    request.Signature,
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                throw new InvalidOperationException("Chữ ký IPN MoMo không hợp lệ.");
            }

            var intent = await _context
                .PaymentIntents.Include(pi => pi.Booking)
                    .ThenInclude(booking => booking!.Tickets)
                .FirstOrDefaultAsync(pi =>
                    pi.Provider == PaymentProvider.Momo && pi.ProviderOrderId == request.OrderId
                );

            if (intent == null)
            {
                throw new KeyNotFoundException("Không tìm thấy giao dịch MoMo.");
            }

            if (
                !string.Equals(
                    request.PartnerCode,
                    _momoOptions.PartnerCode,
                    StringComparison.Ordinal
                )
            )
            {
                throw new InvalidOperationException("Partner code không khớp.");
            }

            if (intent.Amount != request.Amount)
            {
                throw new InvalidOperationException("Số tiền IPN không khớp.");
            }

            intent.ProviderRequestId = request.RequestId;
            intent.ProviderMessage = request.Message;
            intent.ProviderResultCode = request.ResultCode;
            intent.ProviderTransactionId = request.TransId;

            if (request.ResultCode == 0 || request.ResultCode == 9000)
            {
                intent.Status = PaymentIntentStatus.Succeeded;
                intent.PaidAt ??= DateTime.UtcNow;
                if (intent.Booking != null)
                {
                    intent.Booking.Status = BookingStatus.Paid;
                    intent.Booking.ExpiresAt = null;

                    foreach (var ticket in intent.Booking.Tickets)
                    {
                        if (ticket.Status == TicketStatus.Cancelled)
                        {
                            continue;
                        }

                        ticket.Status = TicketStatus.Issued;
                    }
                }
            }
            else if (intent.Status != PaymentIntentStatus.Succeeded)
            {
                intent.Status = PaymentIntentStatus.Failed;

                if (intent.Booking != null && intent.Booking.Status != BookingStatus.Paid)
                {
                    intent.Booking.Status = BookingStatus.Pending;

                    foreach (var ticket in intent.Booking.Tickets)
                    {
                        if (ticket.Status == TicketStatus.Cancelled)
                        {
                            continue;
                        }

                        ticket.Status = TicketStatus.PendingPayment;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return intent;
        }

        public async Task ProcessRefundAsync(Guid refundId)
        {
            ValidateMomoOptions();

            var refund = await _context
                .Refunds.Include(r => r.PaymentIntent)
                    .ThenInclude(pi => pi!.Booking)
                .FirstOrDefaultAsync(r => r.RefundID == refundId);

            if (refund == null)
            {
                throw new KeyNotFoundException("Không tìm thấy refund.");
            }

            var intent = refund.PaymentIntent;
            if (intent == null)
            {
                throw new InvalidOperationException("Refund chưa liên kết giao dịch.");
            }

            if (intent.Provider != PaymentProvider.Momo)
            {
                throw new InvalidOperationException("Chỉ hỗ trợ hoàn tiền MoMo.");
            }

            if (!intent.ProviderTransactionId.HasValue)
            {
                throw new InvalidOperationException("Giao dịch chưa có mã transId từ MoMo.");
            }

            var amount = decimal.Truncate(refund.Amount);
            var requestId = Guid.NewGuid().ToString("N");
            var description = refund.Reason ?? $"Hoan tien booking {intent.BookingID}";
            var rawSignature =
                $"accessKey={_momoOptions.AccessKey}"
                + $"&amount={amount:0}"
                + $"&description={description}"
                + $"&orderId={intent.ProviderOrderId}"
                + $"&partnerCode={_momoOptions.PartnerCode}"
                + $"&requestId={requestId}"
                + $"&transId={intent.ProviderTransactionId.Value}";

            var signature = MomoSignatureHelper.ComputeHmacSha256(
                _momoOptions.SecretKey,
                rawSignature
            );
            var requestBody = new
            {
                partnerCode = _momoOptions.PartnerCode,
                orderId = intent.ProviderOrderId,
                requestId,
                amount = ((long)amount).ToString(),
                transId = intent.ProviderTransactionId.Value,
                lang = _momoOptions.Lang,
                description,
                signature,
            };

            var response = await _httpClient.PostAsJsonAsync("/v2/gateway/api/refund", requestBody);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                refund.Status = RefundStatus.Failed;
                await _context.SaveChangesAsync();
                throw new InvalidOperationException($"Không thể hoàn tiền MoMo: {content}");
            }

            var refundResponse = JsonSerializer.Deserialize<MomoRefundResponse>(
                content,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (refundResponse == null)
            {
                refund.Status = RefundStatus.Failed;
                await _context.SaveChangesAsync();
                throw new InvalidOperationException("Phản hồi refund MoMo không hợp lệ.");
            }

            refund.ProviderRequestId = requestId;
            refund.ProviderMessage = refundResponse.Message;
            refund.ProviderResultCode = refundResponse.ResultCode;
            refund.ProviderTransactionId = refundResponse.RefundTransId;
            refund.ProcessedAt = DateTime.UtcNow;
            refund.Status =
                refundResponse.ResultCode == 0 ? RefundStatus.Completed : RefundStatus.Failed;

            if (refund.Status == RefundStatus.Completed && intent.Booking != null)
            {
                intent.Booking.Status = BookingStatus.Refunded;
            }

            await _context.SaveChangesAsync();
        }

        private void ValidateMomoOptions()
        {
            if (
                string.IsNullOrWhiteSpace(_momoOptions.PartnerCode)
                || string.IsNullOrWhiteSpace(_momoOptions.AccessKey)
                || string.IsNullOrWhiteSpace(_momoOptions.SecretKey)
                || string.IsNullOrWhiteSpace(_momoOptions.Endpoint)
                || string.IsNullOrWhiteSpace(_momoOptions.RedirectUrl)
                || string.IsNullOrWhiteSpace(_momoOptions.FrontendRedirectUrl)
                || string.IsNullOrWhiteSpace(_momoOptions.IpnUrl)
            )
            {
                throw new InvalidOperationException("Cấu hình MoMo chưa đầy đủ.");
            }
        }

        private async Task<PaymentIntent?> FindIntentByOrderIdAsync(string? orderId)
        {
            if (string.IsNullOrWhiteSpace(orderId))
            {
                return null;
            }

            return await _context.PaymentIntents.FirstOrDefaultAsync(pi =>
                pi.Provider == PaymentProvider.Momo && pi.ProviderOrderId == orderId
            );
        }

        private MomoReturnResultDto BuildReturnResult(
            PaymentIntent? intent,
            int resultCode,
            string? message
        )
        {
            var redirectUrl = QueryHelpers.AddQueryString(
                _momoOptions.FrontendRedirectUrl,
                new Dictionary<string, string?>
                {
                    ["intentId"] = intent?.IntentID.ToString(),
                    ["bookingId"] = intent?.BookingID.ToString(),
                    ["orderId"] = intent?.ProviderOrderId,
                    ["resultCode"] = resultCode.ToString(),
                    ["message"] = message,
                }
            );

            return new MomoReturnResultDto
            {
                RedirectUrl = redirectUrl,
                IntentId = intent?.IntentID,
                BookingId = intent?.BookingID,
                ResultCode = resultCode,
                Message = message,
            };
        }

        private sealed class MomoCreateResponse
        {
            public int ResultCode { get; set; }
            public string Message { get; set; } = string.Empty;
            public string? PayUrl { get; set; }
            public string? QrCodeUrl { get; set; }
            public string? Deeplink { get; set; }
        }

        private sealed class MomoRefundResponse
        {
            public int ResultCode { get; set; }
            public string Message { get; set; } = string.Empty;
            public long? RefundTransId { get; set; }
        }
    }
}
