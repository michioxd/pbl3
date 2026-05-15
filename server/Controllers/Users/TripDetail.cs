using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;

namespace Pbl3.Controllers
{
    [ApiController]
    [Route("api/trips")]
    [Tags("Trips")]
    public class TripDetailController : ControllerBase
    {
        private readonly ITripDetailService _tripDetailService;

        public TripDetailController(ITripDetailService tripDetailService)
        {
            _tripDetailService = tripDetailService;
        }

        [HttpGet("{tripId:guid}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(TripDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTripDetail(Guid tripId)
        {
            var result = await _tripDetailService.GetTripDetailAsync(tripId);

            if (result == null)
            {
                return NotFound(new { message = "Trip not found or not available" });
            }

            return Ok(result);
        }
    }
}
