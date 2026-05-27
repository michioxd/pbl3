# Tài liệu ôn vấn đáp .NET & EF Core - Project PBL3

> Vai trò khi trình bày: nói ngắn, đúng trọng tâm, chứng minh được mình hiểu luồng chạy thật trong code.

## 0. Tóm tắt nhanh project

- **Công nghệ:** .NET 10, ASP.NET Core Web API, EF Core 10, PostgreSQL qua `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Loại dự án:** Web API backend cho hệ thống đặt vé xe khách.
- **Kiến trúc:** Monolith theo hướng phân lớp cơ bản: `Controllers` → `Services` → `Data/DbContext` → `Models` → Database.
- **Pattern/kỹ thuật đang dùng:** Dependency Injection, DTO, Service Layer, Options Pattern, JWT Authentication/Authorization, EF Core Migration, DbContext, LINQ, `AsNoTracking`, transaction.
- **Tính năng chính:** đăng nhập JWT/Google, tìm chuyến xe, đặt vé, thanh toán MoMo, quản lý hãng xe, quản trị hệ thống, refund, review, notification.

---

## 1. Cách giới thiệu tổng quan project với giảng viên

### 1.1. Mở bài 30 giây

> "Dạ project của em là backend Web API cho hệ thống đặt vé xe khách. Backend dùng ASP.NET Core Web API, EF Core với PostgreSQL. Code được tổ chức theo hướng Controller nhận request, Service xử lý nghiệp vụ, DbContext làm việc với database, và DTO dùng để trao đổi dữ liệu với client. Project có JWT để xác thực, phân quyền theo role như Passenger, BusAdmin và SysAdmin."

### 1.2. Cách giải thích cấu trúc thư mục

| Thư mục/File | Vai trò |
|---|---|
| `Program.cs` | Cấu hình DI, middleware, CORS, JWT, Swagger, DbContext và pipeline xử lý request. |
| `Controllers/` | Chứa API endpoints. Controller nhận request, validate input cơ bản, gọi service hoặc DbContext, trả response. |
| `Services/` | Chứa nghiệp vụ chính như tìm chuyến, booking, payment, JWT, kiểm tra quyền sở hữu của BusAdmin. |
| `Data/ApplicationDataContext.cs` | DbContext trung tâm, khai báo `DbSet`, quan hệ bảng, enum PostgreSQL, khóa ngoại, index. |
| `Models/` | Entity ánh xạ với bảng trong database. |
| `Dtos/` | Các object dùng cho request/response, tránh trả entity trực tiếp. |
| `Migrations/` | Lịch sử thay đổi schema database do EF Core sinh ra. |
| `Configurations/` | Cấu hình option, ví dụ `MomoOptions`. |
| `Enums/` | Các enum nghiệp vụ như role, trạng thái chuyến, booking, payment. |
| `seed/`, `DataSeeder.cs` | Seed dữ liệu mẫu/ban đầu cho database. |

### 1.3. Luồng dữ liệu khi có request gửi đến

Ví dụ request tìm chuyến xe:

1. Client gọi `GET /api/trips/search`.
2. Middleware chạy theo thứ tự trong `Program.cs`: HTTPS → CORS → Authentication → Authorization → Controller routing.
3. `TripsSearchController` nhận query string vào DTO `TripSearchQuery`.
4. Controller validate dữ liệu đầu vào như tỉnh đi, tỉnh đến, min/max price.
5. Controller gọi `ITripSearchService.SearchTripsAsync()`.
6. `TripSearchService` dùng `ApplicationDbContext` query bảng `Trips`, `Routes`, `Tickets`, `SeatHolds`, `Reviews` bằng LINQ.
7. EF Core dịch LINQ sang SQL PostgreSQL.
8. Kết quả được project sang DTO `TripSearchResult`, không trả entity gốc.
9. Controller trả `Ok(result)` về client dưới dạng JSON.

### 1.4. Cách nói Gen-Z nhưng vẫn học thuật

> "Em hiểu đơn giản là request đi vào như đi qua nhiều lớp kiểm soát: middleware kiểm tra bảo mật và CORS, controller như quầy tiếp nhận, service là nơi xử lý nghiệp vụ, còn DbContext là cầu nối xuống database. DTO là format sạch để trả về frontend, giúp API không bị lộ cấu trúc bảng thật."

---

## 2. Nhóm câu hỏi C# & .NET Core

### Câu 1. Dependency Injection là gì?

**Trả lời:** Dependency Injection là cơ chế đưa dependency từ bên ngoài vào class thay vì class tự khởi tạo. Trong ASP.NET Core, DI container quản lý việc tạo object, vòng đời object và inject qua constructor.

**Liên hệ project:** `TripsSearchController` nhận `ITripSearchService`, còn `TripSearchService` nhận `ApplicationDbContext` qua constructor.

---

### Câu 2. Vì sao nên inject interface thay vì class cụ thể?

**Trả lời:** Inject interface giúp code phụ thuộc vào abstraction, dễ thay implementation, dễ mock khi test, giảm coupling giữa controller và service cụ thể.

---

### Câu 3. Phân biệt Transient, Scoped, Singleton?

| Lifetime | Ý nghĩa | Khi dùng |
|---|---|---|
| Transient | Tạo instance mới mỗi lần resolve. | Service nhẹ, không giữ state. |
| Scoped | Một instance cho mỗi HTTP request. | DbContext, service nghiệp vụ theo request. |
| Singleton | Một instance duy nhất suốt vòng đời app. | Config/cache/service thread-safe. |

**Điểm dễ bị hỏi:** `DbContext` thường dùng **Scoped** vì một request cần một unit of work nhất quán, không nên dùng Singleton do không thread-safe.

---

### Câu 4. Trong project này DI được cấu hình ở đâu?

**Trả lời:** Trong `Program.cs`, ví dụ:

- `AddScoped<ITripSearchService, TripSearchService>()`
- `AddScoped<IBookingService, BookingService>()`
- `AddDbContext<ApplicationDbContext>(...)`
- `AddHttpClient<IPaymentService, PaymentService>(...)`

---

### Câu 5. Middleware là gì?

**Trả lời:** Middleware là các thành phần nằm trong pipeline xử lý request/response. Mỗi middleware có thể xử lý request, gọi middleware tiếp theo, hoặc dừng pipeline.

**Trong project:** `UseHttpsRedirection`, `UseCors`, `UseAuthentication`, `UseAuthorization`, `MapControllers`.

---

### Câu 6. Tại sao thứ tự middleware quan trọng?

**Trả lời:** Vì request đi qua middleware theo thứ tự đăng ký. Authentication phải chạy trước Authorization để hệ thống biết user là ai rồi mới kiểm tra quyền.

**Thứ tự đúng trong project:**

1. `UseCors`
2. `UseAuthentication`
3. `UseAuthorization`
4. `MapControllers`

---

### Câu 7. Async/Await dùng để làm gì trong Web API?

**Trả lời:** `async/await` giúp không block thread khi chờ I/O như query database hoặc gọi API thanh toán. Thread được trả về thread pool để phục vụ request khác, giúp server scale tốt hơn.

---

### Câu 8. `Task<IActionResult>` có ý nghĩa gì?

**Trả lời:** Method trả về bất đồng bộ. `Task` đại diện cho công việc sẽ hoàn thành trong tương lai, còn `IActionResult` là response HTTP sau khi xử lý xong.

---

### Câu 9. Có phải async làm code chạy nhanh hơn không?

**Trả lời:** Không trực tiếp. Async không làm một query SQL nhanh hơn, nhưng giúp server không bị chiếm thread trong lúc chờ I/O, từ đó chịu tải tốt hơn.

---

## 3. Nhóm câu hỏi cốt lõi về EF Core

### Câu 1. DbContext là gì?

**Trả lời:** `DbContext` là lớp trung gian giữa code C# và database. Nó quản lý connection, mapping entity, tracking thay đổi, query bằng LINQ và gọi `SaveChanges()` để ghi dữ liệu.

**Trong project:** `ApplicationDbContext` khai báo các `DbSet` như `Users`, `Trips`, `Bookings`, `Tickets`, `PaymentIntents`.

---

### Câu 2. DbContext lifecycle nên quản lý thế nào?

**Trả lời:** Trong Web API, DbContext nên đăng ký Scoped: mỗi HTTP request dùng một instance. Không nên giữ DbContext lâu, không dùng Singleton, không share giữa nhiều thread.

**Liên hệ project:** `AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(dataSource))` mặc định đăng ký DbContext dạng Scoped.

---

### Câu 3. Vì sao DbContext không nên là Singleton?

**Trả lời:** DbContext không thread-safe, có Change Tracker giữ state. Nếu dùng Singleton sẽ dễ bị lẫn dữ liệu giữa request, memory tăng và lỗi concurrency.

---

### Câu 4. Migration trong EF Core hoạt động thế nào?

**Trả lời:** Migration là cơ chế version hóa schema database. Khi model thay đổi, EF so sánh model hiện tại với snapshot cũ để sinh migration gồm `Up()` và `Down()`. `Up()` áp dụng thay đổi, `Down()` rollback.

**Quy trình thực tế:**

1. Sửa entity hoặc `OnModelCreating`.
2. Chạy lệnh tạo migration.
3. EF sinh file trong `Migrations/`.
4. Review migration.
5. Apply vào database.

---

### Câu 5. Model Snapshot dùng để làm gì?

**Trả lời:** Snapshot lưu trạng thái model gần nhất. EF dùng nó để biết lần sau model thay đổi gì và sinh migration chính xác.

---

### Câu 6. Nếu migration sinh sai thì làm gì?

**Trả lời:** Không apply vội. Cần đọc file migration, chỉnh lại nếu cần, hoặc xóa migration cuối nếu chưa apply. Nếu đã apply database thật thì phải tạo migration mới để sửa, tránh sửa lịch sử migration đã chạy production.

---

### Câu 7. Lazy Loading là gì?

**Trả lời:** Lazy Loading là khi navigation property chỉ được load khi truy cập tới nó. Ưu điểm là tiện, nhược điểm là dễ sinh nhiều query nhỏ, gây lỗi N+1. Project hiện không thể hiện rõ việc bật Lazy Loading proxy.

---

### Câu 8. Eager Loading là gì?

**Trả lời:** Eager Loading load dữ liệu liên quan ngay từ đầu bằng `Include()` và `ThenInclude()`.

**Ví dụ trong project:** Query booking/payment có dùng `Include(b => b.Tickets)` hoặc `Include(pi => pi.Booking)` để lấy dữ liệu liên quan trong cùng luồng xử lý.

---

### Câu 9. Explicit Loading là gì?

**Trả lời:** Explicit Loading là chủ động load navigation property sau khi entity đã được query, bằng `Entry(entity).Reference(...).LoadAsync()` hoặc `Collection(...).LoadAsync()`.

---

### Câu 10. Khi nào dùng Lazy, Eager, Explicit Loading?

| Cách load | Khi dùng | Rủi ro |
|---|---|---|
| Lazy Loading | Prototype, quan hệ ít, cần code nhanh. | Dễ N+1 query, khó kiểm soát SQL. |
| Eager Loading | Biết chắc cần dữ liệu liên quan. | Include quá nhiều làm query nặng. |
| Explicit Loading | Chỉ load quan hệ khi thỏa điều kiện sau bước đầu. | Code dài hơn, cần kiểm soát transaction/context. |

**Câu trả lời an toàn:** Trong API thực tế, em ưu tiên projection sang DTO hoặc Eager Loading có kiểm soát, hạn chế Lazy Loading.

---

### Câu 11. LINQ trong EF Core có chạy trên memory không?

**Trả lời:** Không hẳn. Nếu LINQ còn là `IQueryable`, EF Core sẽ dịch sang SQL và chạy ở database. Khi gọi `ToListAsync()`, dữ liệu mới được materialize về memory. Sau đó LINQ tiếp theo sẽ chạy trên memory.

---

### Câu 12. Phân biệt `IQueryable` và `IEnumerable`?

| Loại | Ý nghĩa |
|---|---|
| `IQueryable` | Query chưa chạy, còn có thể được EF dịch sang SQL. |
| `IEnumerable` | Dữ liệu thường đã ở memory, xử lý bằng C#. |

**Bẫy:** Gọi `ToList()` quá sớm sẽ kéo nhiều dữ liệu về RAM rồi mới lọc, gây chậm.

---

### Câu 13. LINQ và Stored Procedure/Raw SQL khác nhau về hiệu năng thế nào?

**Trả lời ngắn:** LINQ đủ tốt cho đa số CRUD và query thông thường vì EF dịch sang SQL tối ưu tương đối tốt. Stored Procedure/Raw SQL có thể nhanh hơn với query rất phức tạp, báo cáo nặng, batch update hoặc cần tận dụng tính năng riêng của database.

**Nhấn mạnh:** Không phải cứ Stored Procedure là nhanh hơn. Hiệu năng phụ thuộc SQL sinh ra, index, lượng dữ liệu, execution plan và cách query.

---

### Câu 14. Khi nào nên dùng Raw SQL trong EF Core?

**Trả lời:** Khi LINQ khó diễn đạt, query quá phức tạp, cần dùng function riêng của PostgreSQL, cần tối ưu SQL thủ công, hoặc bulk operation. Nhưng phải cẩn thận SQL injection và parameter hóa.

**Liên hệ project:** Seeder có dùng `ExecuteSqlRawAsync` để chạy script seed dữ liệu.

---

### Câu 15. `.AsNoTracking()` là gì?

**Trả lời:** `.AsNoTracking()` báo EF Core không cần tracking entity trong Change Tracker. Nó giảm memory và tăng tốc cho query chỉ đọc.

**Trong project:** Tìm chuyến, xem chi tiết, danh sách quản trị có nhiều query dùng `AsNoTracking()` vì chỉ đọc dữ liệu và trả DTO.

---

### Câu 16. Khi nào không nên dùng `.AsNoTracking()`?

**Trả lời:** Không nên dùng khi cần sửa entity rồi gọi `SaveChanges()`, vì EF không tracking nên không tự biết entity đã thay đổi.

---

### Câu 17. `SaveChangesAsync()` làm gì?

**Trả lời:** Nó gom các thay đổi đang được Change Tracker theo dõi như Added, Modified, Deleted rồi sinh SQL tương ứng trong một transaction mặc định để ghi xuống database.

---

### Câu 18. `OnModelCreating` dùng để làm gì?

**Trả lời:** Dùng Fluent API để cấu hình model: khóa chính, khóa ngoại, quan hệ, delete behavior, index, enum database, required field, max length.

**Trong project:** `ApplicationDbContext` cấu hình enum PostgreSQL, quan hệ `Booking` - `Ticket`, `Notification` - `User`, index cho request, delete behavior.

---

## 4. Nhóm câu hỏi về kiến trúc & code thực tế

### Câu 1. Vì sao cần tách Controller và Service?

**Trả lời:** Controller chỉ nên nhận request, validate cơ bản và trả response. Service chứa nghiệp vụ chính. Tách như vậy giúp code dễ đọc, dễ test, tránh controller quá lớn.

---

### Câu 2. Project có Repository Pattern không?

**Trả lời:** Project chưa tách Repository rõ ràng theo kiểu `IRepository<T>`. Hiện tại dùng `DbContext` trực tiếp trong service/controller. Có thể xem `DbContext` đã đóng vai trò giống Unit of Work và Repository ở mức EF Core.

**Cách nói an toàn:** Với project vừa và nhỏ, dùng DbContext trực tiếp trong service là chấp nhận được. Nếu nghiệp vụ lớn hoặc cần test/đổi nguồn dữ liệu, có thể tách Repository.

---

### Câu 3. Repository Pattern dùng để làm gì?

**Trả lời:** Repository đóng gói logic truy cập dữ liệu, giúp service không phụ thuộc trực tiếp vào EF Core query. Nó tăng khả năng test và tái sử dụng query, nhưng nếu lạm dụng có thể làm code rườm rà vì EF Core DbContext vốn đã là abstraction mạnh.

---

### Câu 4. Unit of Work là gì?

**Trả lời:** Unit of Work gom nhiều thay đổi thành một giao dịch logic và commit một lần. Trong EF Core, `DbContext` + `SaveChanges()` chính là Unit of Work cơ bản.

---

### Câu 5. DTO dùng để làm gì thay vì trả entity trực tiếp?

**Trả lời:** DTO giúp kiểm soát dữ liệu vào/ra API, tránh lộ cấu trúc database, tránh vòng lặp navigation property, giảm payload, bảo vệ field nhạy cảm và tách API contract khỏi entity.

**Ví dụ:** Không nên trả thẳng `User` vì có thể lộ password hash, role internal hoặc navigation không cần thiết.

---

### Câu 6. Vì sao nên project thẳng sang DTO trong LINQ?

**Trả lời:** Project sang DTO bằng `.Select(...)` giúp database chỉ trả các cột cần thiết, giảm dữ liệu truyền qua network và giảm memory server.

**Liên hệ project:** `TripSearchService` select dữ liệu cần thiết thành projection/result thay vì load toàn bộ entity `Trip`.

---

### Câu 7. JWT Authentication hoạt động thế nào?

**Trả lời:** Sau khi đăng nhập thành công, server cấp JWT chứa claim như user id và role. Client gửi token trong header `Authorization: Bearer <token>`. Middleware `UseAuthentication()` xác thực chữ ký, issuer, audience, lifetime; sau đó `UseAuthorization()` kiểm tra role/policy.

---

### Câu 8. Authorization Policy trong project dùng để làm gì?

**Trả lời:** Policy gom điều kiện phân quyền theo role. Ví dụ `AdminOnly` yêu cầu `SysAdmin`, `BusAdmin` cho phép `BusAdmin` hoặc `SysAdmin`.

---

### Câu 9. Options Pattern dùng để làm gì?

**Trả lời:** Options Pattern gom cấu hình thành class strongly-typed. Trong project, `MomoOptions` chứa cấu hình thanh toán MoMo, được bind từ biến môi trường và inject qua `IOptions<MomoOptions>`.

---

### Câu 10. Vì sao dùng transaction thủ công?

**Trả lời:** Khi một nghiệp vụ gồm nhiều thao tác phải thành công hoặc thất bại cùng nhau. Nếu một bước lỗi thì rollback để tránh dữ liệu nửa vời.

**Liên hệ project:** Tạo công ty xe hoặc seed dữ liệu có dùng `BeginTransactionAsync()`.

---

## 5. Câu hỏi bẫy và tình huống tối ưu

### Bẫy 1. Nếu API lấy 10.000 bản ghi bị chậm, em tối ưu thế nào?

**Trả lời:**

1. Thêm phân trang bằng `Skip/Take` hoặc cursor pagination.
2. Dùng `.AsNoTracking()` cho query chỉ đọc.
3. Chỉ select cột cần thiết sang DTO.
4. Kiểm tra và thêm index cho cột lọc/sort.
5. Tránh `Include` quá nhiều, cân nhắc split query hoặc query riêng.
6. Xem SQL sinh ra và execution plan.
7. Cache nếu dữ liệu ít thay đổi.

---

### Bẫy 2. Nếu hai user cùng sửa một dòng dữ liệu thì xử lý sao?

**Trả lời:** Dùng optimistic concurrency với cột version như `RowVersion`/timestamp. Khi update, EF kiểm tra version cũ. Nếu version đã thay đổi thì ném `DbUpdateConcurrencyException`, lúc đó báo conflict cho user hoặc reload dữ liệu mới.

---

### Bẫy 3. Nếu nhiều user cùng đặt một ghế thì tránh trùng vé thế nào?

**Trả lời:** Cần ràng buộc unique ở database cho ghế theo chuyến, dùng transaction, kiểm tra trạng thái seat hold/ticket trong cùng transaction, và xử lý lỗi unique constraint nếu có race condition.

---

### Bẫy 4. Vì sao không validate mọi thứ ở frontend?

**Trả lời:** Frontend chỉ để cải thiện trải nghiệm. Backend vẫn phải validate vì client có thể bị giả mạo. Database cũng cần constraint để bảo vệ tính toàn vẹn cuối cùng.

---

### Bẫy 5. Nếu query dùng `Include` quá nhiều bị chậm thì làm gì?

**Trả lời:** Không load cả object graph. Nên project sang DTO bằng `Select`, tách query nếu cần, dùng `AsSplitQuery()` khi cartesian explosion, và chỉ include quan hệ thật sự cần.

---

### Bẫy 6. N+1 query là gì?

**Trả lời:** Là lỗi khi query 1 danh sách cha, sau đó mỗi phần tử lại phát sinh thêm query lấy con. Tổng thành 1 + N query, rất chậm. Cách tránh là dùng `Include`, projection, hoặc query gom dữ liệu.

---

### Bẫy 7. Nếu gọi `ToListAsync()` sớm có vấn đề gì?

**Trả lời:** Dữ liệu bị kéo về memory sớm, các filter/sort sau đó chạy trên C# thay vì database. Điều này tốn RAM và chậm khi dữ liệu lớn.

---

### Bẫy 8. Khi nào nên đánh index?

**Trả lời:** Đánh index cho cột thường dùng trong `WHERE`, `JOIN`, `ORDER BY`, hoặc unique constraint. Không đánh index bừa vì index làm tăng chi phí ghi dữ liệu và tốn dung lượng.

---

### Bẫy 9. Nếu database production bị lệch migration so với code thì sao?

**Trả lời:** Không sửa tay tùy tiện. Cần kiểm tra bảng lịch sử migration, so sánh schema, backup database, tạo migration sửa lệch hoặc script SQL có kiểm soát, rồi apply qua quy trình triển khai.

---

### Bẫy 10. Vì sao không nên trả entity trực tiếp ra API?

**Trả lời:** Vì có nguy cơ lộ dữ liệu nhạy cảm, phụ thuộc API vào schema database, payload lớn, vòng lặp JSON do navigation property, và khó versioning API.

---

### Bẫy 11. Nếu API bị lỗi CORS thì kiểm tra gì?

**Trả lời:** Kiểm tra origin frontend có đúng với `WithOrigins`, middleware `UseCors` có đặt trước auth/controller không, method/header có được allow không, và request có dùng credentials không.

---

### Bẫy 12. Nếu JWT hợp lệ nhưng vẫn bị 403 thì nguyên nhân?

**Trả lời:** 401 là chưa xác thực, 403 là đã xác thực nhưng không đủ quyền. Cần kiểm tra role claim trong token, `RoleClaimType`, policy yêu cầu role nào, và `[Authorize]` trên endpoint.

---

### Bẫy 13. Nếu dùng Singleton service mà inject DbContext scoped thì sao?

**Trả lời:** Sai lifetime. Singleton sống lâu hơn Scoped nên không được phụ thuộc trực tiếp vào DbContext scoped. Có thể gây lỗi runtime hoặc giữ DbContext quá lâu. Cách đúng là đổi service sang Scoped hoặc dùng scope factory rất cẩn thận.

---

### Bẫy 14. Nếu muốn update entity nhưng query ban đầu dùng `AsNoTracking()` thì làm thế nào?

**Trả lời:** Có thể query lại entity dạng tracking, hoặc attach entity rồi set state/property modified. Cách an toàn nhất là query tracking entity cần sửa, cập nhật field cần thiết, rồi `SaveChangesAsync()`.

---

### Bẫy 15. Nếu cần xóa dữ liệu có quan hệ khóa ngoại thì lưu ý gì?

**Trả lời:** Phải hiểu delete behavior: Cascade, Restrict, SetNull. Nếu xóa cha mà con còn tham chiếu với Restrict thì lỗi. Cần quyết định nghiệp vụ: xóa dây chuyền, chặn xóa, hay set null.

---

## 6. Bộ câu hỏi nhanh để tự luyện

### Câu hỏi ngắn

1. `DbContext` trong project tên gì?
   - `ApplicationDbContext`.

2. Project dùng database provider nào?
   - PostgreSQL qua Npgsql EF Core provider.

3. File nào cấu hình middleware và DI?
   - `Program.cs`.

4. Vì sao `ApplicationDbContext` nên Scoped?
   - Vì mỗi request cần một unit of work riêng và DbContext không thread-safe.

5. `.AsNoTracking()` phù hợp cho query nào?
   - Query chỉ đọc, không update entity.

6. `Include()` dùng để làm gì?
   - Load dữ liệu navigation liên quan.

7. DTO giải quyết vấn đề gì?
   - Kiểm soát dữ liệu API, tránh lộ entity và giảm payload.

8. Migration dùng để làm gì?
   - Version hóa thay đổi schema database.

9. `SaveChangesAsync()` có vai trò gì?
   - Commit các thay đổi đang được tracking xuống database.

10. Middleware auth nào chạy trước?
    - `UseAuthentication()` chạy trước `UseAuthorization()`.

---

## 7. Cách trả lời khi bị hỏi xoáy

### Khi không chắc project có dùng Repository Pattern không

> "Dạ project của em chưa tách Repository riêng. Em dùng Service Layer và inject trực tiếp `ApplicationDbContext`. Với EF Core, DbContext đã đóng vai trò gần giống Repository và Unit of Work. Nếu project mở rộng hoặc cần test phức tạp hơn, em có thể tách repository cho các aggregate/query quan trọng."

### Khi bị hỏi vì sao dùng `AsNoTracking()` nhiều

> "Vì các API danh sách/tìm kiếm chủ yếu chỉ đọc và trả DTO, không cần EF tracking entity. Dùng `AsNoTracking()` giúp giảm overhead của Change Tracker và tiết kiệm memory."

### Khi bị hỏi LINQ có tối ưu không

> "LINQ trong EF Core không chạy ngay trên memory nếu còn là `IQueryable`; nó được dịch sang SQL. Em vẫn cần kiểm tra SQL sinh ra, tránh `ToList` sớm, tránh include quá nhiều và đảm bảo có index phù hợp."

### Khi bị hỏi điểm yếu hiện tại của project

> "Một điểm có thể cải thiện là chuẩn hóa hơn tầng truy cập dữ liệu cho các nghiệp vụ phức tạp, bổ sung concurrency token cho các bảng dễ bị tranh chấp, và tối ưu các query danh sách lớn bằng pagination, projection, index và kiểm tra execution plan."

---

## 8. Checklist trước khi vào vấn đáp

- Nắm được request đi qua `Program.cs` như thế nào.
- Nói được vai trò của `Controller`, `Service`, `DbContext`, `Model`, `DTO`.
- Giải thích được DbContext Scoped và vì sao không Singleton.
- Phân biệt được Lazy/Eager/Explicit Loading.
- Biết khi nào dùng `AsNoTracking()`.
- Biết migration có `Up`, `Down`, snapshot.
- Biết cách tối ưu query lớn: pagination, projection, index, no tracking.
- Biết trả lời concurrency: optimistic concurrency + transaction + unique constraint.
- Biết phân biệt 401 và 403 trong JWT.
- Biết nhận diện điểm mạnh/yếu của kiến trúc hiện tại.

---

## 9. Mẫu kết luận khi trình bày project

> "Tổng kết lại, project của em là ASP.NET Core Web API dùng EF Core với PostgreSQL. Luồng chính là request vào controller, qua service xử lý nghiệp vụ, dùng DbContext query database, sau đó trả DTO cho client. Em chú trọng tách DTO để bảo vệ API contract, dùng DI để giảm phụ thuộc, dùng JWT/policy để phân quyền, và dùng EF Core Migration để quản lý schema. Với hiệu năng, em ưu tiên `AsNoTracking`, projection, pagination và index cho các API đọc nhiều dữ liệu."
