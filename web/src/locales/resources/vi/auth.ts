const auth = {
    fields: {
        fullName: "Họ và tên",
        email: "Email",
        password: "Mật khẩu",
        confirmPassword: "Nhập lại mật khẩu",
    },
    login: {
        tab: "Đăng nhập",
        badge: "Tài khoản khách hàng",
        title: "Chào mừng bạn quay lại",
        description: "Đăng nhập để quản lý vé, theo dõi chuyến đi và nhận ưu đãi cá nhân hóa.",
        helper: "Truy cập lịch sử đặt vé và trạng thái chuyến đi của bạn.",
        submit: "Đăng nhập",
        success: "Đăng nhập thành công!",
        switchPrompt: "Chưa có tài khoản?",
        placeholders: {
            email: "Nhập email của bạn",
            password: "Nhập mật khẩu",
        },
    },
    register: {
        tab: "Đăng ký",
        badge: "Tạo tài khoản mới",
        title: "Tạo tài khoản XeNhanh",
        description: "Đăng ký trong vài bước để lưu thông tin hành khách và nhận khuyến mãi sớm nhất.",
        helper: "Bằng việc đăng ký, bạn đồng ý với điều khoản và chính sách của XeNhanh.",
        submit: "Tạo tài khoản",
        success: "Tạo tài khoản thành công!",
        switchPrompt: "Đã có tài khoản?",
        placeholders: {
            fullName: "Nhập họ và tên",
            email: "Nhập email đăng ký",
            password: "Tạo mật khẩu",
            confirmPassword: "Nhập lại mật khẩu",
        },
    },
    forgot: {
        badge: "Khôi phục mật khẩu",
        title: "Quên mật khẩu?",
        description: "Nhập email để nhận hướng dẫn đặt lại mật khẩu và quay lại hành trình của bạn.",
        helper: "Chúng tôi sẽ gửi liên kết khôi phục đến email bạn đã đăng ký.",
        submit: "Gửi liên kết đặt lại",
        cta: "Quên mật khẩu?",
        back: "Quay lại đăng nhập",
        placeholders: {
            email: "Nhập email để nhận liên kết",
        },
    },
    msg: {
        invalid_credentials: "Email hoặc mật khẩu không hợp lệ. Vui lòng thử lại.",
        google_login_failed: "Đăng nhập Google thất bại. Vui lòng thử lại.",
        legacy_login_is_not_allowed: "Đăng nhập cổ điển không được cho phép.",
        account_is_banned: "Tài khoản của bạn đã bị cấm.",
        email_already_in_use: "Email đã được sử dụng.",
        password_mismatch: "Mật khẩu và xác nhận mật khẩu không khớp.",
    },
    google: {
        success: "Đăng nhập Google thành công!",
        failed: "Đăng nhập Google thất bại. Vui lòng thử lại.",
    },
};

export default auth;
