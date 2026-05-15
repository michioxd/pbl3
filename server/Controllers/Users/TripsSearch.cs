using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;

namespace Pbl3.Controllers
{
    [ApiController]
    [Route("api/trips/search")]
    [Tags("Search")]
    public class TripsSearchController : ControllerBase
    {
        private readonly ITripSearchService _searchService;

        public TripsSearchController(ITripSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(TripSearchResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Search([FromQuery] TripSearchQuery query)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(query.FromProvinceCode))
            {
                return BadRequest(new { message = "FromProvinceCode is required." });
            }

            if (string.IsNullOrWhiteSpace(query.ToProvinceCode))
            {
                return BadRequest(new { message = "ToProvinceCode is required." });
            }

            if (query.MinPrice > query.MaxPrice)
            {
                return BadRequest(new { message = "MinPrice cannot be greater than MaxPrice." });
            }

            var result = await _searchService.SearchTripsAsync(query);

            return Ok(result);
        }
    }
}
