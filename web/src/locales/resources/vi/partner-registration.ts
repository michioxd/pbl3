export default {
    loading: "Đang tải...",
    login_required_title: "Yêu cầu đăng nhập",
    login_required_desc: "Vui lòng đăng nhập để gửi yêu cầu trở thành đối tác.",
    login_required_cta: "Đăng nhập ngay",
    success:
        "Yêu cầu trở thành đối tác đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.",
    error: "Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau.",
    title: "Trở thành đối tác (Mở bán vé trên XeNhanh)",
    description: "Vui lòng điền thông tin doanh nghiệp của bạn để yêu cầu nâng cấp tài khoản thành BusAdmin.",
    fields: {
        company_name: "Tên nhà xe / doanh nghiệp",
        license_number: "Số giấy phép kinh doanh (Tùy chọn)",
        hotline: "Hotline hỗ trợ (Tùy chọn)",
        reason: "Lý do / Mô tả thêm (Tùy chọn)",
    },
    placeholders: {
        company_name: "Nhập tên nhà xe",
        license_number: "Nhập số giấy phép (nếu có)",
        hotline: "Nhập số điện thoại hotline",
        reason: "Mô tả về quy mô, tuyến đường hoạt động...",
    },
    validation: {
        company_name_required: "Vui lòng nhập tên nhà xe",
    },
    submit: "Gửi yêu cầu nâng cấp",
} as const;
