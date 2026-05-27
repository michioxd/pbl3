using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? q,
            [FromQuery] List<string>? roles,
            [FromQuery] List<string>? statuses,
            [FromQuery] string? role,
            [FromQuery] bool? isActive,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortDirection,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var result = await _service.GetUsersAsync(q, roles, statuses, role, isActive, sortBy, sortDirection, page, pageSize);
            return Ok(result);
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserDto dto)
        {
            var result = await _service.CreateUserAsync(dto);
            return Ok(result);
        }

        [HttpPut("users/{userId:guid}")]
        public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] AdminUpdateUserDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _service.UpdateUserAsync(userId, dto, currentUserId);
            return Ok(result);
        }

        [HttpDelete("users/{userId:guid}")]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            var currentUserId = GetCurrentUserId();
            await _service.DeleteUserAsync(userId, currentUserId);
            return Ok(new { message = "Xóa người dùng thành công." });
        }
    }
}
