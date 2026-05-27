using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpGet("dashboard/overview")]
        public async Task<ActionResult<AdminDashboardOverviewDto>> GetDashboardOverview()
        {
            var result = await _service.GetDashboardOverviewAsync();
            return Ok(result);
        }
    }
}
