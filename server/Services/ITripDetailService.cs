using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services
{
    public interface ITripDetailService
    {
        Task<TripDetailDto> GetTripDetailAsync(Guid tripId);
        Task<List<TripSeatDto>> GetTripSeatsAsync(Guid tripId);
        Task<TripReviewsResponseDto> GetTripReviewsAsync(Guid tripId);
        Task<CreateReviewResponseDto> CreateReviewAsync(CreateReviewDto dto, Guid userId);
    }
}
