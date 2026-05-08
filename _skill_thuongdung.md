# Hướng Dẫn Sử Dụng AI Skills Để Prompt Code Hiệu Quả

Dựa vào cấu trúc dự án hiện tại của bạn (React, TypeScript, Tailwind CSS, shadcn/ui), dưới đây là danh sách các **Skills** mà bạn có thể yêu cầu AI sử dụng để hỗ trợ viết code, tối ưu và sửa lỗi một cách chuyên nghiệp nhất.

## 1. 🎨 Các Skills Liên Quan Đến UI / Frontend Framework
*   **`shadcn`**: 
    *   **Khi nào dùng:** Khi cần tạo, sửa đổi hoặc tùy biến các UI components (như `Dialog`, `Select`...).
    *   **Tác dụng:** Đảm bảo AI viết code chuẩn theo pattern của thư viện shadcn/ui, giữ cho giao diện đồng bộ.
*   **`react-patterns`** / **`react-best-practices`**:
    *   **Khi nào dùng:** Khi cần refactor hooks (`useState`, `useEffect`), quản lý state, hoặc tối ưu hóa hiệu suất (tránh re-render thừa).
    *   **Tác dụng:** AI sẽ áp dụng các mẫu thiết kế React hiện đại và an toàn nhất.
*   **`tailwind-patterns`**:
    *   **Khi nào dùng:** Khi xử lý giao diện, styling, layout, responsive.
    *   **Tác dụng:** Cung cấp các utility classes tối ưu, gợi ý code gọn gàng thay vì lạm dụng quá nhiều style.

## 2. 🏗 Các Skills Liên Quan Đến TypeScript & Kiến Trúc
*   **`typescript-pro`** / **`typescript-expert`**:
    *   **Khi nào dùng:** Khi khởi tạo interfaces, types, hoặc gặp khó khăn khi xử lý các lỗi type logic.
    *   **Tác dụng:** Buộc AI tuân thủ strict typing, định nghĩa type chặt chẽ, phát hiện sớm các lỗi tiềm ẩn.
*   **`clean-code`**:
    *   **Khi nào dùng:** Khi file code bắt đầu quá dài (ví dụ file gộp chung cả UI lẫn logic gọi API) và cần chia nhỏ.
    *   **Tác dụng:** AI sẽ phân tách logic rành mạch, tuân thủ các nguyên tắc Clean Code giúp source code dễ đọc và bảo trì hơn.
*   **`frontend-api-integration-patterns`**:
    *   **Khi nào dùng:** Khi cần thiết lập kết nối API, xử lý loading/error states.
    *   **Tác dụng:** Đề xuất cách gọi API tối ưu cho Frontend (ví dụ như cân nhắc dùng SWR/React Query thay cho `useEffect` + `useState`).

## 3. 🧠 Các Skills Tối Ưu Hóa Việc Sử Dụng AI (Prompting)
*   **`prompt-engineering`** / **`prompt-engineer`**:
    *   **Khi nào dùng:** Khi bạn muốn AI hướng dẫn ngược lại cho bạn cách đặt câu hỏi tối ưu nhất.
    *   **Tác dụng:** Cung cấp framework và mẫu prompt cực kỳ giá trị để giao tiếp với AI.
*   **`code-reviewer`**:
    *   **Khi nào dùng:** Sau khi bạn vừa tự hoàn thành một file/chức năng.
    *   **Tác dụng:** AI sẽ đóng vai trò như một Senior Developer review code của bạn, chỉ ra lỗi bảo mật, bug tiềm ẩn và đề xuất cách tối ưu.

---

## 💡 Ví dụ: Cách đặt câu hỏi (Prompt) kết hợp Skills

Để đạt hiệu quả cao nhất, thay vì nói một cách chung chung như *"Sửa lỗi cho tôi"*, hãy kết hợp gọi tên skill như các ví dụ sau:

> **Ví dụ 1 (Refactor code):**
> *"Dựa trên skill **react-patterns** và **clean-code**, hãy giúp tôi tách logic xử lý API (hàm `handleSave`) trong file `trip-dialog.tsx` ra thành một custom hook riêng biệt để file UI này gọn gàng hơn."*

> **Ví dụ 2 (Thêm UI):**
> *"Sử dụng skill **shadcn** và **tailwind-patterns**, hãy tạo cho tôi một component Bảng (Table) hiển thị danh sách chuyến xe, có hỗ trợ responsive cho điện thoại."*

> **Ví dụ 3 (Review code):**
> *"Hãy dùng skill **code-reviewer** và **typescript-pro** để đánh giá file `trip-dialog.tsx` hiện tại, chỉ ra những điểm có thể gây lỗi type hoặc có khả năng giảm hiệu năng khi app phình to."*
