using System;
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
    public class ProvincesSearchController(ILocationSearchService searchService) : ControllerBase
    {
        private readonly ILocationSearchService _searchService = searchService;

        // GET /api/landing/provinces/search?query=hoà khánh lien chieu da nang
        [AllowAnonymous]
        [HttpGet]
        [ProducesResponseType(typeof(List<ProvinceResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<List<ProvinceResponse>>> Search(
            [FromQuery(Name = "query")] string? query
        )
        {
            try
            {
                var result = await _searchService.SearchProvincesAsync(query);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
