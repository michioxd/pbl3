using System.Collections.Generic;
using System.Threading.Tasks;
using Pbl3.Dtos;

namespace Pbl3.Services
{
    public interface ILocationSearchService
    {
        Task<List<ProvinceResponse>> SearchProvincesAsync(string? query);
    }
}
