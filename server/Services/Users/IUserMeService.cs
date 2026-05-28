using System;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services.Users
{
    public interface IUserMeService
    {
        Task<MeResponseDto> GetMeDetailsAsync(Guid userId);
        Task<MyOrdersResponseDto> GetMyOrdersAsync(Guid userId);
    }
}
