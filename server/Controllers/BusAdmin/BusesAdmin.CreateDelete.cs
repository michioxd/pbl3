using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;

namespace Pbl3.Controllers.BusAdmin
{
    public partial class BusesController
    {
        private IActionResult HandleCommandResult((int StatusCode, string? ErrorMessage, object? Data) result)
        {
            if (result.StatusCode == 200 || result.StatusCode == 201)
                return StatusCode(result.StatusCode, result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPost]
        [Authorize(Policy = "BusAdmin")]
        public async Task<IActionResult> CreateBus([FromBody] CreateBusDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _commandService.CreateBusAsync(companyId.Value, dto);
            return HandleCommandResult(result);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteBus(Guid id)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _commandService.DeleteBusAsync(companyId.Value, id);
            return HandleCommandResult(result);
        }

        [HttpPost("trips")]
        public async Task<IActionResult> CreateTrip([FromBody] CreateTripDto dto)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _commandService.CreateTripAsync(companyId.Value, dto);
            return HandleCommandResult(result);
        }

        [HttpDelete("trips/{tripId:guid}")]
        public async Task<IActionResult> DeleteTrip(Guid tripId)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _commandService.DeleteTripAsync(companyId.Value, tripId);
            return HandleCommandResult(result);
        }

        [HttpPost("bus-types/{busTypeId:guid}/seat-layouts")]
        public async Task<IActionResult> CreateSeatLayout(
            Guid busTypeId,
            [FromBody] CreateSeatLayoutDto dto
        )
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _commandService.CreateSeatLayoutAsync(companyId.Value, busTypeId, dto);
            return HandleCommandResult(result);
        }

        [HttpDelete("seat-layouts/{layoutId:guid}")]
        public async Task<IActionResult> DeleteSeatLayout(Guid layoutId)
        {
            var companyId = await GetCurrentCompanyIdAsync();
            if (companyId == null)
                return Forbid();

            var accessError = await EnsureCompanyAccessAsync(companyId.Value);
            if (accessError != null)
                return accessError;

            var result = await _commandService.DeleteSeatLayoutAsync(companyId.Value, layoutId);
            return HandleCommandResult(result);
        }
    }
}
