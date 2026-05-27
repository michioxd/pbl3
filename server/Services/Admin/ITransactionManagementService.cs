using System;
using System.Threading.Tasks;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Services.Admin
{
    public interface ITransactionManagementService
    {
        Task<TransactionListResponseDto> GetTransactionsAsync(
            PaymentProvider? provider,
            PaymentIntentStatus? status,
            DateTime? startDate,
            DateTime? endDate,
            string? search,
            int page,
            int pageSize
        );

        Task<TransactionDetailDto> GetTransactionDetailAsync(Guid intentId);
    }
}
