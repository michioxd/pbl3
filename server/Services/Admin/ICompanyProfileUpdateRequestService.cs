using System;
using System.Threading.Tasks;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Services.Admin
{
    public interface ICompanyProfileUpdateRequestService
    {
        Task<object> GetRequestsAsync(
            CompanyProfileUpdateRequestStatus? status,
            int page,
            int pageSize
        );

        Task ReviewRequestAsync(
            Guid requestId,
            ReviewCompanyProfileUpdateRequestDto dto,
            Guid reviewerUserId
        );
    }
}
