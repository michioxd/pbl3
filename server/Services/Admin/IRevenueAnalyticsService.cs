using System;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services.Admin
{
    public interface IRevenueAnalyticsService
    {
        Task<RevenueAnalyticsDto> GetRevenueAnalyticsAsync(
            DateTime? startDate,
            DateTime? endDate,
            int topRoutesLimit = 10,
            int topCompaniesLimit = 10
        );
    }
}
