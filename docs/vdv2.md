# Vấn đáp .NET/EF Core phần 2 - Hỏi xoáy trực tiếp vào code PBL3

> Tinh thần tài liệu: thầy mở code hỏi "đoạn này để làm gì, vì sao viết vậy, ai làm phần này có hiểu không?" thì trả lời được ngay. Không múa công nghệ, không nói chung chung.

---

## 0. Bản đồ đọc code trong 3 phút

| Khu vực | File nên mở | Câu trả lời một dòng |
| --- | --- | --- |
| Khởi động app | `server/Program.cs` | Cấu hình DI, DbContext, JWT, CORS, Swagger, middleware và chạy migrate/seed. |
| Mapping database | `server/Data/ApplicationDataContext.cs` | Khai báo bảng `DbSet`, quan hệ, enum PostgreSQL, index, delete behavior. |
| Migration/seed | `server/Extensions/HostExtension.cs`, `server/Data/DbInitializer.cs`, `server/Data/DataSeeder.cs` | Tự migrate khi chạy app, seed dữ liệu mẫu khi có flag. |
| Auth thường | `server/Controllers/Auth/Legacy.cs` | Login/register bằng email password, hash password, cấp JWT. |
| Auth Google | `server/Controllers/Auth/Google.cs` | Validate Google id token, tạo user/passenger nếu chưa có, cấp JWT. |
| JWT | `server/Services/JwtTokenService.cs` | Sinh token chứa `sub`, `jti`, `email`, `role`. |
| Lấy user hiện tại | `server/Services/BusAdminAccessServices.cs` | Đọc user id từ claim trong token bằng `IHttpContextAccessor`. |
| Tìm chuyến | `server/Services/TripSearchService.cs` | Query chuyến theo tỉnh/ngày/giá/tiện ích, tính ghế còn trống, trả DTO. |
| Chi tiết chuyến | `server/Controllers/Users/TripDetail.cs` | Lấy thông tin chuyến, ghế, điểm đón/trả, review. |
| Đặt vé | `server/Services/BookingServices.cs` | Validate chuyến, điểm đón/trả, ghế, tạo booking và ticket. |
| Thanh toán | `server/Services/PaymentServices.cs`, `server/Controllers/Payments/MomoPaymentsController.cs` | Tạo giao dịch MoMo, ký HMAC, xử lý IPN, cập nhật booking/ticket. |
| Bus admin | `server/Controllers/BusAdmin/BusesAdmin*.cs` | CRUD xe/chuyến/sơ đồ ghế nhưng phải kiểm tra quyền sở hữu nhà xe. |
| System admin | `server/Controllers/Admin/SystemAdminManagement*.cs` | Quản lý user, company, dashboard, revenue, refund, review. |
| Enum nghiệp vụ | `server/Enums/Enums.cs` | Trạng thái user, chuyến, booking, ticket, payment, refund, review. |

---

## 1. Nếu thầy mở `Program.cs`

### Hỏi: File này làm nhiệm vụ gì?

**Trả lời:** `Program.cs` là entry point của ASP.NET Core app. Nó cấu hình service container, database, JWT, CORS, Swagger, payment options, sau đó dựng middleware pipeline và map controller.

### Hỏi: Vì sao có `Env.Load()` ở đầu?

**Trả lời:** Để load biến môi trường từ file `.env`. Project dùng biến môi trường cho cấu hình nhạy cảm như `DATABASE_URL`, `JWT_KEY`, thông tin MoMo, Google Client ID. Như vậy không hard-code secret trong code.

### Hỏi: Vì sao dùng `AddScoped<ITripSearchService, TripSearchService>()`?

**Trả lời:** Service nghiệp vụ phụ thuộc vào `ApplicationDbContext`, mà DbContext là scoped theo request. Vì vậy service cũng nên scoped để cùng vòng đời request, tránh giữ DbContext quá lâu.

### Hỏi: Vì sao có cả `AddHttpClient<IPaymentService, PaymentService>()`?

**Trả lời:** `PaymentService` cần gọi API MoMo. Dùng `HttpClientFactory` giúp quản lý vòng đời HTTP connection tốt hơn so với tự `new HttpClient()`, tránh socket exhaustion.

### Hỏi: `AddDbContext<ApplicationDbContext>` làm gì?

**Trả lời:** Đăng ký DbContext vào DI và cấu hình EF Core dùng PostgreSQL qua `UseNpgsql(dataSource)`. Mặc định `AddDbContext` tạo DbContext theo lifetime scoped.

### Hỏi: Vì sao phải `MapEnum<UserRole>()` và `HasPostgresEnum`?

**Trả lời:** Vì project dùng PostgreSQL enum native. `MapEnum` giúp Npgsql biết cách map enum C# sang enum PostgreSQL ở runtime, còn `HasPostgresEnum` giúp EF đưa enum vào model/migration.

### Hỏi: Vì sao `UseAuthentication()` phải trước `UseAuthorization()`?

**Trả lời:** Authentication xác định user là ai từ JWT. Authorization dùng thông tin user/role đó để kiểm tra quyền. Nếu đảo ngược, authorization không có identity để xét.

### Hỏi: `args.Contains("--migrate")` và `--seed` dùng để làm gì?

**Trả lời:** Cho phép chạy app ở chế độ thao tác database: `--migrate` chỉ apply migration rồi thoát, `--seed` seed dữ liệu rồi thoát. Tiện cho deploy hoặc setup môi trường.

### Bị bắt bẻ: `InitializeDatabaseAsync()` đang chạy migration mỗi lần app start, ổn không?

**Trả lời:** Với môi trường học tập/dev thì tiện vì database tự cập nhật. Nhưng production nên cân nhắc tách migration thành bước deploy riêng để tránh nhiều instance cùng migrate hoặc migration lỗi làm ảnh hưởng startup.

---

## 2. Nếu thầy mở `ApplicationDataContext.cs`

### Hỏi: `DbSet<T>` là gì?

**Trả lời:** `DbSet<T>` đại diện cho một tập entity tương ứng bảng trong database, ví dụ `Trips`, `Bookings`, `Tickets`. Qua đó EF Core tạo query, thêm/sửa/xóa dữ liệu.

### Hỏi: `OnModelCreating` để làm gì?

**Trả lời:** Đây là nơi cấu hình model bằng Fluent API: khóa chính, quan hệ, khóa ngoại, delete behavior, index, enum PostgreSQL, required/max length.

### Hỏi: Vì sao có `.OnDelete(DeleteBehavior.Restrict)` ở một số quan hệ?

**Trả lời:** Để chặn xóa dây chuyền không mong muốn. Ví dụ ticket gắn với trip/passenger, nếu xóa trip mà ticket còn tồn tại thì không nên tự động xóa lịch sử vé.

### Hỏi: Khi nào dùng `Cascade`, `Restrict`, `SetNull`?

| DeleteBehavior | Ý nghĩa | Ví dụ trả lời |
| --- | --- | --- |
| `Cascade` | Xóa cha thì xóa con. | Booking bị xóa thì ticket đi kèm có thể bị xóa nếu nghiệp vụ cho phép. |
| `Restrict` | Chặn xóa nếu còn con. | Không cho xóa trip đã có ticket. |
| `SetNull` | Xóa cha thì FK con thành null. | User hoặc booking liên quan notification có thể set null để giữ lịch sử. |

### Hỏi: Vì sao tạo index cho email?

**Trả lời:** Email dùng để đăng nhập và cần unique. Index unique vừa tăng tốc tìm user theo email, vừa đảm bảo database không cho trùng email.

### Hỏi: Fluent API khác Data Annotation thế nào?

**Trả lời:** Data Annotation đặt trực tiếp trên class/property, đơn giản. Fluent API đặt tập trung trong `OnModelCreating`, mạnh hơn cho quan hệ phức tạp, composite index, delete behavior, enum mapping.

### Bị hỏi xoáy: Nếu entity và migration lệch nhau thì sao?

**Trả lời:** Code model chỉ là mong muốn hiện tại, database thật phụ thuộc migration đã apply. Cần kiểm tra migration history, snapshot, schema thật; không tự sửa database production tùy tiện.

---

## 3. Nếu thầy mở `HostExtension.cs`, `DbInitializer.cs`, `DataSeeder.cs`

### Hỏi: Vì sao tạo scope thủ công bằng `CreateScope()`?

**Trả lời:** Các service như DbContext/DbInitializer là scoped. Ở ngoài request HTTP không có scope sẵn, nên phải tạo scope thủ công để resolve và dispose đúng vòng đời.

### Hỏi: `MigrateAsync()` khác `EnsureCreated()` thế nào?

**Trả lời:** `MigrateAsync()` áp dụng migration và giữ lịch sử version schema. `EnsureCreated()` chỉ tạo database theo model hiện tại, không phù hợp khi dùng migration lâu dài.

### Hỏi: Seeder dùng transaction để làm gì?

**Trả lời:** Seed nhiều bảng liên quan. Nếu giữa chừng lỗi thì rollback, tránh database bị nửa dữ liệu cũ nửa dữ liệu mới.

### Bị bắt bẻ: Seed bằng SQL raw có nguy hiểm không?

**Trả lời:** Nếu SQL raw lấy input người dùng thì nguy hiểm SQL injection. Ở đây seed script là file nội bộ để khởi tạo dữ liệu nên rủi ro thấp hơn. Tuy nhiên vẫn cần review script vì nó tác động trực tiếp database.

---

## 4. Nếu thầy mở module Auth

### 4.1. `Legacy.cs` - đăng nhập/register thường

#### Hỏi: Luồng login hoạt động thế nào?

**Trả lời:** Nhận email/password, normalize email, tìm user kèm role bằng `Include(u => u.Role)`, kiểm tra account active, verify password bằng `IPasswordHasher`, sau đó gọi `JwtTokenService` tạo token.

#### Hỏi: Vì sao phải `Include(u => u.Role)`?

**Trả lời:** JWT cần claim `role`. Nếu không load Role thì `JwtTokenService` không biết role name để đưa vào token.

#### Hỏi: `IPasswordHasher<User>` làm gì?

**Trả lời:** Hash password khi register và verify password khi login. Không lưu mật khẩu plain text trong database.

#### Hỏi: Đoạn `isLegacyPlainTextPassword` để làm gì?

**Trả lời:** Đây là cơ chế migrate mật khẩu cũ nếu database từng lưu plain text. Nếu password hash verify fail nhưng chuỗi password khớp trực tiếp, hệ thống cho login một lần rồi hash lại password.

#### Bị bắt bẻ: Đoạn này có rủi ro không?

**Trả lời:** Có. Nó chỉ nên là giải pháp chuyển tiếp tạm thời. Sau khi migrate xong dữ liệu, nên bỏ hỗ trợ plain text để giảm rủi ro bảo mật.

#### Hỏi: Vì sao register tạo cả `User` và `Passenger` trong transaction?

**Trả lời:** Vì đây là một nghiệp vụ nguyên tử. Nếu tạo user thành công nhưng passenger lỗi thì dữ liệu bị lệch. Transaction đảm bảo hoặc cả hai cùng thành công, hoặc rollback.

### 4.2. `Google.cs` - đăng nhập Google

#### Hỏi: Google login khác legacy login thế nào?

**Trả lời:** Google login không dùng password nội bộ. Backend nhận `IdToken`, validate với Google Client ID, lấy email/name từ payload. Nếu chưa có user thì tạo user role Passenger và passenger profile.

#### Hỏi: Vì sao `PasswordHash = string.Empty`?

**Trả lời:** User Google không đăng nhập bằng password hệ thống, nên password hash để rỗng. Trong legacy login, nếu password hash rỗng thì trả 403 không cho đăng nhập bằng mật khẩu.

#### Bị bắt bẻ: Query `u.Email.ToLower() == email` có tối ưu không?

**Trả lời:** Không tối ưu bằng lưu email đã normalize hoặc dùng index/collation case-insensitive, vì gọi `ToLower()` trên cột có thể làm giảm khả năng dùng index tùy database. Với project nhỏ tạm chấp nhận, nhưng production nên chuẩn hóa email khi lưu.

---

## 5. Nếu thầy mở `JwtTokenService.cs`

### Hỏi: Token chứa những claim gì?

**Trả lời:** Token chứa `sub` là UserID, `jti` là mã token duy nhất, `email`, và `role`. Những claim này dùng để định danh user và phân quyền.

### Hỏi: Vì sao dùng `sub` cho user id?

**Trả lời:** `sub` là claim chuẩn JWT đại diện subject/token owner. Dùng UserID ở `sub` giúp backend lấy được user hiện tại từ token.

### Hỏi: `jti` để làm gì?

**Trả lời:** `jti` là unique id của token. Nó hữu ích nếu sau này muốn blacklist/revoke token hoặc audit token.

### Hỏi: Vì sao dùng HmacSha256?

**Trả lời:** Đây là thuật toán ký đối xứng. Server dùng secret key để ký và verify token. Phù hợp với hệ thống một backend đơn giản.

### Bị bắt bẻ: JWT 7 ngày có vấn đề gì?

**Trả lời:** Token sống 7 ngày tiện cho user nhưng nếu bị lộ thì rủi ro cao hơn. Production nên cân nhắc refresh token, thời gian access token ngắn hơn và cơ chế revoke.

---

## 6. Nếu thầy mở `BusAdminAccessServices.cs`

### Hỏi: `CurrentUserContext` làm gì?

**Trả lời:** Nó đóng gói logic lấy UserID từ claim trong `HttpContext.User`, tránh lặp code ở nhiều controller/service.

### Hỏi: Vì sao dùng `IHttpContextAccessor`?

**Trả lời:** Service không trực tiếp có `Controller.User`, nên dùng `IHttpContextAccessor` để truy cập HttpContext hiện tại.

### Hỏi: `BusAdminOwnershipService` đóng góp gì?

**Trả lời:** Nó kiểm tra tài nguyên có thuộc công ty của bus admin không: route, bus, trip, bus type. Đây là lớp chống việc bus admin thao tác dữ liệu của nhà xe khác.

### Bị hỏi xoáy: Vì sao không chỉ dựa vào `[Authorize(Policy = "BusAdmin")]`?

**Trả lời:** Policy chỉ xác nhận user có role BusAdmin. Nó không biết user đó sở hữu company/route/bus nào. Vẫn cần ownership check ở mức dữ liệu.

---

## 7. Nếu thầy mở `TripSearchService.cs`

### Hỏi: Service này làm phần nào trong project?

**Trả lời:** Nó xử lý nghiệp vụ tìm chuyến xe: lọc chuyến theo tỉnh đi/đến, ngày, hãng xe, giá, tiện ích, khung giờ; tính ghế còn trống; build filter/summary; phân trang và trả `TripSearchResult`.

### Hỏi: Vì sao bắt đầu bằng `.Trips.AsNoTracking()`?

**Trả lời:** Đây là API đọc dữ liệu, không update entity. `AsNoTracking` giảm chi phí Change Tracker, nhẹ hơn khi query danh sách.

### Hỏi: Vì sao dùng `.Select(...)` projection thay vì `Include` hết?

**Trả lời:** Projection chỉ lấy cột cần trả về, để EF dịch thành SQL phù hợp. Nếu `Include` toàn bộ object graph thì payload lớn, dễ chậm.

### Hỏi: `SoldSeats` và `HeldSeats` khác nhau thế nào?

**Trả lời:** `SoldSeats` là ghế đã có ticket trạng thái `Issued` hoặc `CheckedIn`. `HeldSeats` là ghế đang được giữ tạm bằng `SeatHold` và chưa hết hạn. Ghế khả dụng = tổng ghế - sold - held.

### Hỏi: Vì sao có `utcNow` truyền vào query?

**Trả lời:** Để so sánh seat hold còn hạn bằng `ExpiresAt > utcNow`. Dùng một giá trị thời gian cố định trong request giúp kết quả nhất quán hơn so với gọi `DateTime.UtcNow` nhiều lần.

### Bị bắt bẻ: Đoạn service có `ToListAsync()` rồi mới filter khung giờ/tiện ích, có thể tối ưu không?

**Trả lời:** Có. Một số filter đang chạy in-memory sau khi materialize, vì cần xử lý list tiện ích/time range. Với dữ liệu lớn nên cố gắng đưa filter xuống SQL hoặc thiết kế bảng/query để lọc ở database nhiều hơn.

### Bị bắt bẻ: `LowestPrice` lấy min từ ticket đã bán có hợp lý không?

**Trả lời:** Nếu chưa có ticket bán thì fallback 0. Về nghiệp vụ hiển thị giá, có thể nên dùng `BasePrice` làm giá thấp nhất mặc định. Đây là điểm có thể cải thiện để tránh hiển thị 0 gây hiểu nhầm.

---

## 8. Nếu thầy mở `TripDetail.cs`

### Hỏi: File này làm gì?

**Trả lời:** Cung cấp API chi tiết chuyến, danh sách ghế, review và tạo review. Nó vừa query thông tin chuyến vừa build DTO trả cho frontend.

### Hỏi: Vì sao `GetTripDetail` dùng anonymous projection lớn?

**Trả lời:** Để gom các thông tin cần thiết của trip thành một query có kiểm soát, không trả entity trực tiếp. Cách này giảm payload và tránh vòng lặp navigation khi serialize JSON.

### Hỏi: `BuildTripSeatsAsync` làm gì?

**Trả lời:** Nó lấy danh sách ghế không khả dụng từ ticket đã phát hành/check-in và seat hold còn hạn, sau đó query seat layout để đánh dấu `IsAvailable` cho từng ghế.

### Hỏi: Vì sao review phải `booking.Status == Paid`?

**Trả lời:** Chỉ user đã mua/hoàn tất thanh toán mới được review, tránh review ảo.

### Hỏi: Vì sao review mới tạo có `Status = Pending`?

**Trả lời:** Review cần qua moderation của admin trước khi public, tránh nội dung spam hoặc không phù hợp.

### Bị bắt bẻ: Điều kiện `trip.Status != Completed && trip.ArrivalTime > DateTime.UtcNow` có chặt không?

**Trả lời:** Ý định là chỉ cho review chuyến đã hoàn thành hoặc đã qua giờ đến. Nhưng logic thời gian cần thống nhất timezone và trạng thái trip. Production nên có job cập nhật trạng thái trip rõ ràng.

---

## 9. Nếu thầy mở `BookingServices.cs`

### Hỏi: Luồng tạo booking gồm những bước nào?

**Trả lời:**

1. Tìm trip kèm route/company/bus type.
2. Kiểm tra trip còn `Scheduled`.
3. Nếu thanh toán cash thì kiểm tra nhà xe có cho `AllowPayOnBoard`.
4. Lấy route stops, kiểm tra điểm đón/trả hợp lệ.
5. Đảm bảo điểm đón đứng trước điểm trả bằng `StopOrder`.
6. Tìm passenger profile của user.
7. Tính ghế không khả dụng từ ticket đã bán và seat hold còn hạn.
8. Kiểm tra seat layout thuộc bus type của trip.
9. Tạo `Booking` và `Ticket` trạng thái pending.
10. `SaveChangesAsync()` và trả DTO.

### Hỏi: Vì sao kiểm tra `pickupStop.StopOrder >= dropoffStop.StopOrder`?

**Trả lời:** Để đảm bảo hành khách lên xe trước khi xuống xe trên cùng tuyến. Nếu điểm đón sau hoặc bằng điểm trả thì sai nghiệp vụ.

### Hỏi: Vì sao `ExpiresAt` cash là 12h còn MoMo 15 phút?

**Trả lời:** Booking online cần hết hạn nhanh để không giữ ghế quá lâu khi chưa thanh toán. Cash có thể cho thời gian dài hơn vì thanh toán khi lên xe, tùy nghiệp vụ nhà xe.

### Hỏi: Vì sao ticket ban đầu là `PendingPayment`?

**Trả lời:** Vì ghế mới được đặt tạm trong booking, chưa thanh toán thành công. Khi MoMo IPN thành công, ticket chuyển thành `Issued`.

### Hỏi: `FinalPrice` khác `BasePrice` để làm gì?

**Trả lời:** `BasePrice` là giá gốc của chuyến. `FinalPrice` là giá thực tế trên vé sau này có thể áp dụng khuyến mãi, phụ phí, dynamic pricing. Hiện code đang gán bằng `BasePrice`.

### Bẫy lớn: Hai user cùng đặt một ghế cùng lúc thì sao?

**Trả lời:** Hiện code check ghế trống rồi insert ticket, nhưng chưa thấy unique constraint/locking rõ ràng ở đoạn này. Có race condition nếu hai request song song cùng qua bước check. Cách sửa là thêm unique constraint ở database cho `(TripID, SeatLayoutID)` với trạng thái hợp lệ, dùng transaction isolation/row lock, hoặc cơ chế seat hold atomic.

### Bị hỏi: `SaveChangesAsync()` ở đây có transaction không?

**Trả lời:** EF Core mặc định bọc một lần `SaveChanges` trong transaction nếu provider hỗ trợ. Nhưng transaction đó chỉ bảo vệ các insert/update trong `SaveChanges`, không tự khóa được khoảng thời gian check ghế trước đó.

---

## 10. Nếu thầy mở `PaymentServices.cs`

### Hỏi: PaymentService làm gì?

**Trả lời:** Quản lý luồng thanh toán MoMo: validate cấu hình, tạo payment intent, ký request bằng HMAC, gọi API MoMo, xử lý callback IPN/return, cập nhật booking/ticket, và xử lý refund.

### Hỏi: Vì sao có `ValidateMomoOptions()`?

**Trả lời:** Để fail sớm nếu thiếu cấu hình MoMo như partner code, access key, secret key, endpoint, redirect URL, IPN URL. Tránh gọi API với config rỗng gây lỗi khó debug.

### Hỏi: `rawSignature` để làm gì?

**Trả lời:** MoMo yêu cầu tạo chuỗi tham số đúng thứ tự rồi ký HMAC-SHA256 bằng secret key. Signature giúp MoMo xác nhận request từ đúng merchant và backend xác nhận callback từ MoMo.

### Hỏi: Vì sao thứ tự tham số trong chữ ký quan trọng?

**Trả lời:** HMAC ký trên chuỗi raw. Chỉ cần khác thứ tự hoặc khác format amount/orderInfo là signature khác, MoMo sẽ từ chối hoặc backend verify fail.

### Hỏi: `PaymentIntent` là gì?

**Trả lời:** Nó là bản ghi đại diện cho một nỗ lực thanh toán của booking với provider cụ thể, lưu amount, order id, request id, payUrl, status, transaction id.

### Hỏi: Khi IPN thành công thì code làm gì?

**Trả lời:** Verify signature, tìm payment intent theo order id, kiểm tra partner code và amount, cập nhật intent `Succeeded`, set booking `Paid`, xóa `ExpiresAt`, đổi ticket từ pending sang `Issued`.

### Hỏi: Vì sao IPN endpoint `AllowAnonymous`?

**Trả lời:** Vì callback đến từ MoMo, không có JWT của user. Bảo mật của endpoint nằm ở verify signature HMAC và kiểm tra partner/amount/orderId.

### Bị bắt bẻ: Controller catch mọi lỗi IPN rồi vẫn trả `NoContent`, có hợp lý không?

**Trả lời:** Mục tiêu có thể là tránh MoMo retry quá nhiều hoặc tránh lộ lỗi. Nhưng điểm yếu là mất thông tin lỗi nếu không logging. Production nên log lỗi IPN để audit và debug.

### Hỏi: Vì sao callback thành công chấp nhận `ResultCode == 0 || 9000`?

**Trả lời:** Theo logic tích hợp MoMo, các mã này được xem là thanh toán thành công/authorized tùy loại giao dịch. Cần đối chiếu tài liệu MoMo để giải thích chính xác theo môi trường.

### Bị hỏi: IPN bị gọi 2 lần thì sao?

**Trả lời:** Code set `PaidAt ??= DateTime.UtcNow` nên không ghi đè paid time. Nếu đã succeeded mà IPN fail đến sau, nhánh fail không hạ trạng thái vì có kiểm tra `intent.Status != Succeeded`. Tuy nhiên vẫn nên thiết kế idempotency rõ hơn và log callback.

### Hỏi: Refund hoạt động thế nào?

**Trả lời:** Tìm refund kèm payment intent/booking, chỉ hỗ trợ MoMo, yêu cầu có provider transaction id, ký request refund, gọi API MoMo, cập nhật refund status và nếu completed thì booking thành `Refunded`.

---

## 11. Nếu thầy mở `MomoPaymentsController.cs`

### Hỏi: Controller này nên làm gì và không nên làm gì?

**Trả lời:** Controller chỉ nhận request, lấy user id, gọi `IPaymentService`, map exception sang HTTP status. Logic ký HMAC, gọi MoMo, update DB nằm trong service.

### Hỏi: Vì sao endpoint create/get/verify cần `[Authorize]` nhưng ipn/return không?

**Trả lời:** Create/get/verify là thao tác của user nên cần JWT. IPN/return là request từ MoMo hoặc browser redirect, không có JWT; bảo mật bằng signature và verify sau đó.

### Hỏi: `Forbid(ex.Message)` có trả message ra client không?

**Trả lời:** `Forbid` chủ yếu trả 403 challenge/forbid theo auth scheme, không phải cách chuẩn để trả body message. Nếu muốn message rõ nên trả `StatusCode(403, new { message = ex.Message })`.

---

## 12. Nếu thầy mở Bus Admin

### Hỏi: Vì sao `BusesController` là `partial class`?

**Trả lời:** Để chia controller lớn thành nhiều file theo nhóm chức năng như get, create/delete, update. Khi compile, các phần partial hợp lại thành một class.

### Hỏi: `EnsureCompanyAccessAsync` kiểm tra gì?

**Trả lời:** Kiểm tra công ty tồn tại, đã được duyệt, và không có yêu cầu cập nhật hồ sơ đang pending. Nếu chưa đạt thì chặn bus admin thao tác.

### Hỏi: Vì sao tạo trip phải kiểm tra route thuộc company?

**Trả lời:** Bus admin chỉ được tạo chuyến trên tuyến của nhà xe mình. Nếu không check, bus admin có thể gắn chuyến vào route của công ty khác.

### Hỏi: Vì sao xóa bus bị chặn nếu bus đã có trip hoặc đang active?

**Trả lời:** Bus đã gán vào trip là dữ liệu lịch sử/nghiệp vụ, xóa sẽ làm mất tham chiếu. Bus active cũng không nên xóa trực tiếp; nên deactivate trước.

### Hỏi: Tạo nhiều trip bằng `DepartureDates` để làm gì?

**Trả lời:** Cho phép nhà xe tạo cùng một chuyến lặp lại theo nhiều ngày. Code distinct và sort ngày để tránh trùng ngày trong request.

### Bị bắt bẻ: `CreateTrip` có kiểm tra `BusTypeID` thuộc nhà xe không?

**Trả lời:** Đoạn đọc thấy check route và bus ownership, nhưng cần kiểm tra thêm bus type có hợp lệ/thuộc công ty không, nhất là khi `BusID` null. Nếu chưa check đủ thì đây là điểm cần cải thiện.

---

## 13. Nếu thầy mở System Admin

### Hỏi: Vì sao controller admin cũng là `partial`?

**Trả lời:** Vì chức năng admin rộng: user, company, dashboard, review, refund, revenue. Partial giúp tách file theo use case để dễ đọc hơn.

### Hỏi: Dashboard overview tính revenue thế nào?

**Trả lời:** Query ticket theo tháng của trip, chỉ cộng `FinalPrice` của ticket trạng thái `Issued` hoặc `CheckedIn`. Ticket cancelled không tính doanh thu.

### Hỏi: Vì sao dùng `AsNoTracking()` nhiều trong dashboard?

**Trả lời:** Dashboard chỉ đọc số liệu thống kê, không sửa entity. No tracking giúp query nhẹ hơn.

### Hỏi: Vì sao build `monthlyStats` đủ 6 tháng kể cả tháng không có dữ liệu?

**Trả lời:** Để frontend chart luôn có đủ mốc thời gian. Tháng không có dữ liệu thì revenue/ticket = 0.

### Bị bắt bẻ: Dashboard có nhiều query riêng lẻ, tối ưu được không?

**Trả lời:** Có. Nhiều `CountAsync/SumAsync` dễ tạo nhiều round-trip database. Có thể gom query, dùng materialized view, cache dashboard hoặc stored procedure nếu dữ liệu lớn.

---

## 14. Nếu thầy mở `Enums.cs`

### Hỏi: Enum dùng để làm gì?

**Trả lời:** Enum định nghĩa tập trạng thái hợp lệ cho nghiệp vụ, ví dụ `TripStatus`, `BookingStatus`, `TicketStatus`, `PaymentIntentStatus`. Nó giúp code rõ nghĩa hơn so với dùng số/string rời rạc.

### Hỏi: Vì sao `PaymentProvider` có Stripe nhưng code chủ yếu MoMo?

**Trả lời:** Enum đang thiết kế mở cho nhiều provider, nhưng implementation hiện tại mới hoàn thiện MoMo/Cash. Nếu bị hỏi, phải nói rõ phần Stripe chưa được triển khai đầy đủ, không nhận là đã làm.

### Hỏi: `RefundStatus.Processed` comment old kept for compatibility nghĩa là gì?

**Trả lời:** Đây là dấu vết tương thích dữ liệu/code cũ. Khi enum đã dùng trong DB/migration, xóa hoặc đổi tên tùy tiện có thể làm lỗi dữ liệu hiện có.

---

## 15. Các câu hỏi "thằng này làm phần nào" theo module

### Nếu em phụ trách Auth

Phải nói được:

- Login thường nằm ở `Auth/Legacy.cs`.
- Google login nằm ở `Auth/Google.cs`.
- JWT tạo ở `JwtTokenService.cs`.
- Password dùng `IPasswordHasher<User>`.
- Role claim tên là `role`, khớp với `RoleClaimType = "role"` trong `Program.cs`.
- UserID lấy từ `sub`.

Không được mơ hồ ở:

- Vì sao phải `Include Role`.
- Vì sao Google user không có password.
- 401 khác 403.

### Nếu em phụ trách Search/Trip

Phải nói được:

- Search service lọc theo route province/district/ward, ngày đi, hãng, giá, tiện ích, khung giờ.
- `AsNoTracking` vì chỉ đọc.
- `Select` projection để không load entity thừa.
- Ghế còn trống = total - issued/checkedin - held chưa hết hạn.
- `TripDetail` build seat map bằng `SeatLayouts`.

Không được mơ hồ ở:

- `Ticket` khác `SeatHold`.
- `ToListAsync()` là điểm query chạy thật.
- Vì sao filter sau `ToListAsync()` có thể chậm.

### Nếu em phụ trách Booking

Phải nói được:

- Booking tạo cả `Booking` và `Ticket`.
- `PickupStop` phải trước `DropoffStop`.
- Cash phụ thuộc `AllowPayOnBoard` của nhà xe.
- Ticket ban đầu `PendingPayment`.
- Thanh toán thành công mới chuyển `Issued`.

Không được mơ hồ ở:

- Race condition khi hai user cùng đặt ghế.
- Vì sao `SaveChanges` chưa đủ chống race.
- Vì sao cần unique constraint/transaction/lock.

### Nếu em phụ trách Payment

Phải nói được:

- MoMo request cần HMAC SHA256.
- IPN phải verify signature.
- PaymentIntent lưu trạng thái giao dịch.
- Thành công thì booking `Paid`, ticket `Issued`.
- Refund chỉ hỗ trợ MoMo trong code hiện tại.

Không được mơ hồ ở:

- Thứ tự raw signature.
- IPN anonymous nhưng vẫn an toàn nhờ signature.
- Idempotency khi callback lặp.

### Nếu em phụ trách Admin/BusAdmin

Phải nói được:

- Role policy chỉ là lớp đầu, ownership check mới chặn truy cập dữ liệu nhà xe khác.
- Bus admin không được sửa route/bus/trip không thuộc company.
- Company phải approved mới được thao tác.
- Dashboard tính doanh thu từ ticket issued/checkedin.
- Review cần pending/approved/rejected.

Không được mơ hồ ở:

- Vì sao dùng partial controller.
- Vì sao không xóa bus/trip đã có dữ liệu liên quan.
- Query dashboard có thể tối ưu gì.

---

## 16. Bộ câu hỏi bẫy "mở code chỉ dòng"

### 1. `ClockSkew = TimeSpan.Zero` trong JWT để làm gì?

**Trả lời:** Mặc định JWT validation có thể cho lệch vài phút. Set zero nghĩa là token hết hạn đúng thời điểm `exp`, nghiêm ngặt hơn.

### 2. `MapInboundClaims = false` để làm gì?

**Trả lời:** Không cho middleware tự đổi tên claim JWT sang claim kiểu Microsoft. Nhờ vậy claim `sub` và `role` giữ đúng tên mình set.

### 3. `RoleClaimType = "role"` vì sao cần?

**Trả lời:** Vì JWT tự sinh claim role với key `role`. Authorization policy cần biết claim nào đại diện role.

### 4. `Environment.GetEnvironmentVariable(...) ?? builder.Configuration[...]` có ý nghĩa gì?

**Trả lời:** Ưu tiên biến môi trường, fallback về appsettings. Phù hợp deploy vì secret/config có thể lấy từ environment.

### 5. Vì sao nhiều API trả DTO chứ không trả `Ok(entity)`?

**Trả lời:** DTO kiểm soát schema response, tránh lộ field nhạy cảm, tránh navigation loop, giảm dữ liệu trả về.

### 6. Vì sao `DateTime.UtcNow` tốt hơn `DateTime.Now` trong backend?

**Trả lời:** UTC tránh lệch timezone giữa server/database/client, phù hợp lưu thời gian hệ thống và so sánh expiry.

### 7. Vì sao query seat unavailable dùng `Concat(...).Distinct()`?

**Trả lời:** Gom ghế đã bán và ghế đang hold thành một tập seat id duy nhất, tránh trùng nếu cùng seat xuất hiện ở nhiều nguồn.

### 8. Vì sao `PaymentIntent.Amount` phải so với `request.Amount` từ IPN?

**Trả lời:** Để đảm bảo callback thanh toán đúng số tiền của booking, tránh giả mạo hoặc sai giao dịch.

### 9. Vì sao IPN tìm intent bằng `ProviderOrderId`?

**Trả lời:** MoMo callback trả về `orderId` của provider. Backend dùng nó để map về payment intent nội bộ.

### 10. Vì sao có `Created`, `Succeeded`, `Failed` cho payment intent?

**Trả lời:** Đây là state machine tối thiểu của giao dịch: đã tạo, thành công, thất bại. Giúp backend biết xử lý booking/ticket thế nào.

### 11. Vì sao không nên tin `resultCode` từ frontend return?

**Trả lời:** Frontend/browser redirect có thể bị giả mạo. Phải verify signature và/hoặc dựa vào IPN/server-side check.

### 12. Vì sao controller catch `KeyNotFoundException` thành 404?

**Trả lời:** Vì exception này biểu diễn tài nguyên không tồn tại, tương ứng HTTP 404.

### 13. Vì sao `InvalidOperationException` thường map thành 400?

**Trả lời:** Vì đây thường là lỗi nghiệp vụ hoặc request không hợp lệ, ví dụ ghế hết chỗ, booking đã paid, config không hợp lệ.

### 14. Vì sao `AsNoTracking` không dùng cho update?

**Trả lời:** Entity không được Change Tracker theo dõi, nên sửa property rồi `SaveChanges` sẽ không tự update.

### 15. Vì sao `Include` đôi khi làm chậm?

**Trả lời:** Include nhiều collection có thể tạo join lớn/cartesian explosion, trả nhiều dòng trùng. Nên dùng projection hoặc split query khi cần.

---

## 17. Những điểm yếu nên nhận thẳng, đừng cãi

### 17.1. Race condition đặt ghế

**Nói thật:** Code đã check ghế trống nhưng chưa khóa ở database rõ ràng. Khi request song song, vẫn có khả năng double booking.

**Cách cải thiện:** Unique constraint, transaction isolation, row-level lock, hoặc seat hold atomic.

### 17.2. Expiry booking/seat hold

**Nói thật:** Có `ExpiresAt` nhưng cần background job để dọn booking hết hạn hoặc chuyển status. Nếu không, dữ liệu pending có thể tồn tại lâu.

**Cách cải thiện:** Hangfire/BackgroundService chạy định kỳ cancel booking expired và expire seat hold.

### 17.3. Dashboard nhiều query

**Nói thật:** Dễ đọc, đúng chức năng, nhưng nếu dữ liệu lớn có thể nhiều round-trip DB.

**Cách cải thiện:** Cache, view/materialized view, gom aggregate query, index.

### 17.4. Validate chưa đồng nhất

**Nói thật:** Một số DTO có DataAnnotations, một số logic validate thủ công. Có thể chuẩn hóa bằng FluentValidation hoặc custom validation layer.

### 17.5. Stripe enum chưa có implementation

**Nói thật:** Enum có Stripe nhưng code thanh toán hiện tập trung MoMo/Cash. Đây là phần mở rộng chưa triển khai, không nên nói là đã support Stripe đầy đủ.

---

## 18. Mẫu trả lời khi bị hỏi "em có làm phần này không?"

### Nếu có làm thật

> "Dạ phần này em có làm. Cụ thể file chính là `...`. Em xử lý luồng từ controller nhận request, service validate nghiệp vụ, rồi dùng DbContext query/update. Điểm quan trọng nhất của phần này là ... Nếu cải thiện tiếp thì em sẽ ..."

### Nếu chỉ hỗ trợ một phần

> "Dạ phần này em có tham gia ở mức ... Em nắm luồng chính là ... Phần em không trực tiếp code là ..., nhưng em hiểu nó hoạt động như sau ..."

### Nếu không làm

> "Dạ phần này không phải phần em code chính. Em không muốn nhận nhầm. Nhưng em đã đọc để tích hợp: nó nằm ở file ..., nhiệm vụ là ..., input/output là ..."

### Tuyệt đối tránh

- "Cái này framework tự làm hết ạ".
- "Em không rõ nhưng chắc là để tối ưu".
- "Bạn em làm nên em không biết".
- "Do ChatGPT sinh ra".
- "Em nghĩ vậy thôi".

---

## 19. Checklist sống còn trước khi vấn đáp

- Mở được `Program.cs` và nói đúng thứ tự middleware.
- Chỉ ra được service nào đăng ký scoped và vì sao.
- Mở được `ApplicationDataContext.cs` và giải thích 3 quan hệ bất kỳ.
- Nói được migration, seed, transaction khác nhau thế nào.
- Nói được auth thường và auth Google khác nhau.
- Nói được token chứa claim nào và role policy hoạt động ra sao.
- Nói được search trip tính ghế trống thế nào.
- Nói được booking tạo booking/ticket ra sao.
- Nói được MoMo ký HMAC và verify IPN ra sao.
- Nói được bus admin ownership check để chống sửa dữ liệu công ty khác.
- Nhận thẳng được 3 điểm yếu: race condition ghế, expiry cleanup, dashboard nhiều query.

---

## 20. Câu kết luận an toàn với giảng viên

> "Dạ nếu mở code trực tiếp thì project của em đi theo luồng khá rõ: `Program.cs` cấu hình DI/middleware, controller nhận request, service xử lý nghiệp vụ, `ApplicationDbContext` query database bằng EF Core, rồi trả DTO. Những chỗ em tự tin nhất là auth/JWT, search trip, booking, payment MoMo và ownership check cho bus admin. Những điểm em biết còn có thể cải thiện là chống race condition khi đặt ghế, background job xử lý booking hết hạn, và tối ưu dashboard khi dữ liệu lớn."
