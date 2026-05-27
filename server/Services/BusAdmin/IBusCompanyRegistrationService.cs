using System;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services.BusAdmin
{
    public interface IBusCompanyRegistrationService
    {
        Task<object> AddBusCompanyAsync(Infor_BusCompany company, Guid userId);
    }
}
