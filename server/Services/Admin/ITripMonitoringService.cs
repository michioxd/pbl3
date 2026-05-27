using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services.Admin
{
    public interface ITripMonitoringService
    {
        Task<TripsMonitoringListResponseDto> GetAllTripsAsync(
            string? q,
            List<string>? statuses,
            Guid? companyId,
            DateTime? startDate,
            DateTime? endDate,
            string? sortBy,
            string? sortDirection,
            int page,
            int pageSize
        );

        Task<List<TripMonitoringListItemDto>> GetActiveTripsAsync();

        Task<RoutePerformanceListResponseDto> GetRoutePerformanceAsync(
            DateTime? startDate,
            DateTime? endDate
        );
    }
}
