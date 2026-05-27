using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Services.Admin;
using System;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system/transactions")]
    [Authorize(Policy = "AdminOnly")]
    [Tags("SystemAdmin")]
    public class TransactionManagement : ControllerBase
    {
        private readonly ITransactionManagementService _service;

        public TransactionManagement(ITransactionManagementService service)
        {
            _service = service;
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
            var response = await _service.GetTransactionsAsync(
                provider,
                status,
                startDate,
                endDate,
                search,
                page,
                pageSize
            );
            return Ok(response);
        }

        [HttpGet("{intentId:guid}")]
        public async Task<IActionResult> GetTransactionDetail(Guid intentId)
        {
            var response = await _service.GetTransactionDetailAsync(intentId);
            return Ok(response);
        }
    }
}
