using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;

namespace Pbl3.Controllers.Admin
{
    [Authorize(Roles = "SysAdmin")]
    [Route("api/admin/system/refunds")]
    [ApiController]
    public class RefundManagementController(
        IRefundManagementService refundService,
        ICurrentUserContext currentUserContext
    ) : ControllerBase
    {
        private readonly IRefundManagementService _refundService = refundService;
        private readonly ICurrentUserContext _currentUserContext = currentUserContext;

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
            try
            {
                var result = await _refundService.GetRefundRequestsAsync(
                    q,
                    statuses,
                    startDate,
                    endDate,
                    sortBy,
                    sortDirection,
                    page,
                    pageSize
                );
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{refundRequestId:guid}")]
        public async Task<IActionResult> GetRefundRequestDetail(Guid refundRequestId)
        {
            try
            {
                var result = await _refundService.GetRefundRequestDetailAsync(refundRequestId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost("{refundRequestId:guid}/approve")]
        public async Task<IActionResult> ApproveRefund(
            Guid refundRequestId,
            [FromBody] ProcessRefundRequestDto dto
        )
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                var warning = await _refundService.ApproveRefundAsync(refundRequestId, dto, userId);

                if (warning != null)
                {
                    return Ok(new
                    {
                        message = "Đã duyệt yêu cầu hoàn tiền.",
                        paymentProcessingWarning = warning,
                    });
                }

                return Ok(new { message = "Đã duyệt yêu cầu hoàn tiền." });
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

        [HttpPost("{refundRequestId:guid}/reject")]
        public async Task<IActionResult> RejectRefund(
            Guid refundRequestId,
            [FromBody] ProcessRefundRequestDto dto
        )
        {
            try
            {
                var userId = _currentUserContext.GetRequiredUserId();
                await _refundService.RejectRefundAsync(refundRequestId, dto, userId);
                return Ok(new { message = "Đã từ chối yêu cầu hoàn tiền." });
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

        [HttpPost]
        public async Task<IActionResult> CreateRefundRequest([FromBody] CreateRefundRequestDto dto)
        {
            try
            {
                var refundRequestId = await _refundService.CreateRefundRequestAsync(dto);
                return Ok(new { refundRequestId });
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
    }
}
