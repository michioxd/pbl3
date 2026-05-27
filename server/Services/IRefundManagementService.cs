using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services
{
    public interface IRefundManagementService
    {
        Task<RefundRequestsListResponseDto> GetRefundRequestsAsync(
            string? q,
            List<string>? statuses,
            DateTime? startDate,
            DateTime? endDate,
            string? sortBy,
            string? sortDirection,
            int page,
            int pageSize
        );

        Task<RefundRequestDetailDto> GetRefundRequestDetailAsync(Guid refundRequestId);
        Task<string?> ApproveRefundAsync(Guid refundRequestId, ProcessRefundRequestDto dto, Guid processedByUserId);
        Task RejectRefundAsync(Guid refundRequestId, ProcessRefundRequestDto dto, Guid processedByUserId);
        Task<Guid> CreateRefundRequestAsync(CreateRefundRequestDto dto);
    }
}
