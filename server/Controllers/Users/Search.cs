using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;

namespace Pbl3.Controllers
{
    [ApiController]
    [Route("api/landing/provinces/search")]
    [Tags("Search")]
    public class ProvincesSearchController : ControllerBase
    {
        private readonly IProvinceSearchService _provinceSearchService;

        public ProvincesSearchController(IProvinceSearchService provinceSearchService)
        {
            _provinceSearchService = provinceSearchService;
        }

        // GET /api/landing/provinces/search?query=hoà khánh lien chieu da nang
        [AllowAnonymous]
        [HttpGet]
        [ProducesResponseType(typeof(List<ProvinceResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<List<ProvinceResponse>>> Search(
            [FromQuery(Name = "query")] string? query
        )
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest(new { message = "Query is required." });

            var result = await _provinceSearchService.SearchAsync(query);

            return Ok(result);
        }
    }
}
