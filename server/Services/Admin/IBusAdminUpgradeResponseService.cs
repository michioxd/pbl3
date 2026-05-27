using System;
using System.Threading.Tasks;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Services.Admin
{
    public interface IBusAdminUpgradeResponseService
    {
        Task<BusAdminUpgradeRequestListResponseDto> GetRequestsAsync(
            BusAdminUpgradeRequestStatus? status,
            int page,
            int pageSize
        );

        Task<int> GetPendingCountAsync();

        Task<object> ReviewRequestAsync(
            Guid requestId,
            ReviewBusAdminUpgradeRequestDto dto,
            Guid reviewerUserId
        );
    }
}
