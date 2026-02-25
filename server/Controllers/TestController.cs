using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;

namespace Pbl3.Controllers
{
    [ApiController]

    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Select(u => new UserDto
                {
                    Id = u.UserID,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role.ToString()
                })
                .ToListAsync();

            return Ok(users);
        }
    }
}