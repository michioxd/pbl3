using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;

namespace Pbl3.Controllers.Payments
{
    [ApiController]
    [Route("api/payments/momo")]
    public class MomoPaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly ICurrentUserContext _currentUserContext;

        public MomoPaymentsController(
            IPaymentService paymentService,
            ICurrentUserContext currentUserContext
        )
        {
            _paymentService = paymentService;
            _currentUserContext = currentUserContext;
        }

        [HttpPost("create")]
        [Authorize(Policy = "UserOnly")]
        public async Task<IActionResult> CreatePayment([FromBody] CreateMomoPaymentRequestDto dto)
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                var result = await _paymentService.CreateMomoPaymentAsync(dto.BookingId, userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("intents/{intentId:guid}")]
        [Authorize(Policy = "UserOnly")]
        public async Task<IActionResult> GetPaymentStatus(Guid intentId)
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                var result = await _paymentService.GetPaymentStatusAsync(intentId, userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost("ipn")]
        [AllowAnonymous]
        public async Task<IActionResult> HandleIpn([FromBody] MomoIpnRequestDto dto)
        {
            try
            {
                await _paymentService.HandleMomoIpnAsync(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"MoMo IPN Error: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"Stack: {ex.StackTrace}");
                return NoContent();
            }
        }

        [HttpGet("return")]
        [AllowAnonymous]
        public IActionResult HandleReturn([FromQuery] MomoIpnRequestDto dto)
        {
            var result = _paymentService.BuildMomoReturnRedirect(dto);
            return Redirect(result.RedirectUrl);
        }

        [HttpPost("return/verify")]
        [Authorize(Policy = "UserOnly")]
        public async Task<IActionResult> VerifyReturn([FromBody] MomoIpnRequestDto dto)
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                var result = await _paymentService.VerifyMomoReturnAsync(dto, userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
