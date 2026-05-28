using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services.Users
{
    public interface IPassengersService
    {
        Task<BusAdminUpgradeRequestResponseDto> CreateBusAdminUpgradeRequestAsync(CreateBusAdminUpgradeRequestDto dto, Guid userId);
        Task<PassengerProfileDto> GetProfileAsync(Guid userId);
        Task<List<PassengerTicketDetailDto>> GetMyTicketsAsync(Guid userId);
        Task<Guid> CreateTicketRefundRequestAsync(Guid ticketId, CreateRefundRequestDto dto, Guid userId);
        Task UpdateProfileAsync(UpdatePassengerDto dto, Guid userId);
    }
}
