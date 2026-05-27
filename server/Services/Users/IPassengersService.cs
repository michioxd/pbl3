using System;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services.Users
{
    public interface IPassengersService
    {
        Task<object> CreateBusAdminUpgradeRequestAsync(CreateBusAdminUpgradeRequestDto dto, Guid userId);
        Task<object> GetProfileAsync(Guid userId);
        Task<object> GetMyTicketsAsync(Guid userId);
        Task<Guid> CreateTicketRefundRequestAsync(Guid ticketId, CreateRefundRequestDto dto, Guid userId);
        Task UpdateProfileAsync(UpdatePassengerDto dto, Guid userId);
    }
}
