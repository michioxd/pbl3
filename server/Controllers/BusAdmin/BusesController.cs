using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Models;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("api/busadmin/buses")]
    // [Authorize(Roles = "BusAdmin")] // Mở comment này khi đã set up Auth và JWT
    public class BusesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BusesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // API Test: Lấy tất cả danh sách xe bảo gồm cả tên công ty và loại xe (Giống TestController)
        [AllowAnonymous]
        
        [HttpGet("GetAllBus")]
        public async Task<IActionResult> GetAll()
        {
            var buses = await _context.Buses
                .Include(b => b.BusCompany)
                .Include(b => b.BusType)
                .Select(b => new
                {
                    Id = b.BusID,
                    PlateNumber = b.PlateNumber,
                    CompanyName = b.BusCompany != null ? b.BusCompany.Name : "Unknown",
                    BusType = b.BusType != null ? b.BusType.Name : "Unknown",
                    TotalSeats = b.BusType != null ? b.BusType.TotalSeats : 0,
                    IsActive = b.IsActive
                })
                .ToListAsync();

            return Ok(buses);
        }

        // Lấy danh sách xe của nhà xe
        
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetCompanyBuses(Guid companyId)
        {
            var buses = await _context.Buses
                .Include(b => b.BusType)
                .Where(b => b.CompanyID == companyId)
                .Select(b => new
                {
                    b.BusID,
                    b.PlateNumber,
                    b.IsActive,
                    BusType = new
                    {
                        b.BusType!.BusTypeID,
                        b.BusType.Name,
                        b.BusType.TotalSeats
                    }
                })
                .ToListAsync();

            return Ok(buses);
        }

        // Cập nhật trạng thái hoặc thông tin xe
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBus(Guid id, [FromBody] Bus updateBus)
        {
            var bus = await _context.Buses.FindAsync(id);
            if (bus == null)
            {
                return NotFound(new { message = "Bus not found." });
            }

            bus.PlateNumber = updateBus.PlateNumber;
            bus.IsActive = updateBus.IsActive;
            bus.BusTypeID = updateBus.BusTypeID;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Bus updated successfully." });
        }

        // Thêm mới một xe
        [HttpPost]
        public async Task<IActionResult> CreateBus([FromBody] Bus newBus)
        {
            // Khởi tạo ID nếu chưa có
            if (newBus.BusID==Guid.Empty)
            {
                newBus.BusID=Guid.NewGuid();
            }

             _context.Add(newBus);

            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = newBus.BusID }, newBus);
        }

        // Cập nhật một phần (Ví dụ: chỉ cập nhật trạng thái IsActive)
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateBusStatus(Guid id, [FromBody] bool isActive)
        {
            var bus=await _context.Buses.FindAsync(id);

            if (bus==null)
            {
                return NotFound(new {message="xe khong duoc tim thay"});
            }
            bus.IsActive=isActive;
            await _context.SaveChangesAsync();

            return Ok(new {message ="trang thai xe da duoc cap nhat thanh cong"});
        }

        // Xóa một xe
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBus(Guid id)
        {
            var bus = await _context.Buses.FindAsync(id);
            if (bus == null)
            {
                return NotFound(new { message = "Bus not found." });
            }


            if (bus.IsActive!=true)
            {
                _context.Buses.Remove(bus);
            }
            else 
            {
                return Ok(new {message="xe nay dang hoat dong , nen ko the xoa"});
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Bus deleted successfully." });
        }

        // [HttpGet("{id}/Info_busCompany")]
        // public async Task<IActionResult> Info(Guid id,[FromRoute] )
        // {
        //     var bus_company=await _context.BusCompanies
        //         .Include(bc =>bc.Routes)
        //         .Include()
        //         .Select(bc=>new
        //         {
        //             bc.CompanyID,
        //             bc.Name,
                    
                    
        //         }).ToList();
            

        //     return Ok();
        // }
    }
}
