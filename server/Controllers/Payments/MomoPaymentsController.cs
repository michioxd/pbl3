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
            catch
            {
                return NoContent();
            }
        }
    }
}
