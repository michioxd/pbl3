using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services.Admin
{
    public interface IReviewManagementService
    {
        Task<ReviewsListResponseDto> GetReviewsAsync(
            string? q,
            List<string>? statuses,
            int? minRating,
            int? maxRating,
            bool? flaggedOnly,
            DateTime? startDate,
            DateTime? endDate,
            string? sortBy,
            string? sortDirection,
            int page,
            int pageSize
        );

        Task<ReviewDetailDto> GetReviewDetailAsync(Guid reviewId);
        Task ApproveReviewAsync(Guid reviewId, Guid userId);
        Task RejectReviewAsync(Guid reviewId, ModerateReviewDto dto, Guid userId);
        Task FlagReviewAsync(Guid reviewId, ModerateReviewDto dto, Guid userId);
        Task UnflagReviewAsync(Guid reviewId, Guid userId);
    }
}
