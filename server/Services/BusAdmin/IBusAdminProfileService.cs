using System;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services.BusAdmin
{
    public interface IBusAdminProfileService
    {
        Task<CompanyProfileUpdateRequestDto> GetCurrentRequestAsync(Guid companyId);
        Task<object> CreateRequestAsync(CreateCompanyProfileUpdateRequestDto dto, Guid companyId, Guid userId);
        Task<object> GetCompanyProfileAsync(Guid companyId);
        Task<object> UpdateCompanyProfileRequestAsync(UpdateCompanyProfileDto dto, Guid companyId, Guid userId);
    }
}
