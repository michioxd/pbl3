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
};

export default auth;
