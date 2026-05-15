const hero = {
    title: "XeNhanh - Nền tảng đặt vé xe hàng đầu",
    subtitle: "Cam kết giữ chỗ 100% - Hoàn tiền nếu không có xe.",
    tabs: {
        oneway: "Một chiều",
        roundtrip: "Khứ hồi",
    },
    fields: {
        from: "Nơi đi",
        to: "Nơi đến",
        departureDate: "Ngày đi",
        returnDate: "Ngày về",
    },
    placeholders: {
        fromFull: "Nhập tỉnh, thành phố nơi đi",
        toFull: "Nhập tỉnh, thành phố nơi đến",
        fromShort: "Điểm đi",
        toShort: "Điểm đến",
    },
    actions: {
        searchTrip: "Tìm chuyến xe",
        search: "Tìm",
        addReturnDate: "Thêm ngày về",
        add: "Thêm",
    },
    promotions: {
        badge: "Khuyến mãi hôm nay",
        title: "Ưu đãi nổi bật",
        description: "Săn mã giảm giá, flash sale và ưu đãi dành riêng cho chuyến đi tiếp theo.",
        viewAll: "Xem tất cả",
        hotDeal: "Hot deal",
        validityPrefix: "Hiệu lực đến",
        cardDescription: "Áp dụng nhanh khi thanh toán online, số lượng mã có hạn trong ngày.",
        saveNow: "Lưu ngay để dùng",
        claimOffer: "Nhận ưu đãi",
        items: {
            newUser: {
                title: "Giảm 20% cho khách hàng mới",
                validUntil: "30/11/2026",
            },
            dalat: {
                title: "Flash Sale tuyến Sài Gòn - Đà Lạt",
                validUntil: "15/12/2026",
            },
            roundtrip: {
                title: "Ưu đãi khứ hồi tiết kiệm 100k",
                validUntil: "Hết hạn trong 3 ngày",
            },
        },
    },
    popularRoutes: {
        badge: "Gợi ý nổi bật",
        title: "Tuyến đường phổ biến",
        description: "Các hành trình được đặt nhiều với giá tốt và lịch trình linh hoạt mỗi ngày.",
        exploreMore: "Khám phá thêm",
        priceFrom: "Giá từ {{price}}",
        bookTrip: "Đặt chuyến này",
        imageAlt: "Tuyến {{from}} đi {{to}}",
        places: {
            saigon: "Sài Gòn",
            dalat: "Đà Lạt",
            hanoi: "Hà Nội",
            sapa: "Sapa",
            nhatrang: "Nha Trang",
            danang: "Đà Nẵng",
            hoian: "Hội An",
        },
    },
    features: {
        badge: "Vì sao chọn XeNhanh",
        title: "Trải nghiệm đặt vé nhanh, an tâm và đáng tin cậy",
        description:
            "Từ tìm chuyến, giữ chỗ đến hỗ trợ sau khi đặt vé, mọi bước đều được tối ưu để người dùng yên tâm.",
        items: {
            choices: {
                title: "Đa dạng lựa chọn",
                description:
                    "Hơn 2000+ nhà xe chất lượng cao với nhiều dòng xe như Limousine, Giường nằm, Ghế ngồi cho mọi nhu cầu di chuyển.",
                badge: "Nhiều hãng xe uy tín",
            },
            quality: {
                title: "Chất lượng đảm bảo",
                description:
                    "Đánh giá chân thực từ hàng triệu hành khách cùng cam kết giữ chỗ và chính sách hoàn tiền rõ ràng khi phát sinh sự cố.",
                badge: "Đánh giá minh bạch",
            },
            support: {
                title: "Hỗ trợ 24/7",
                description:
                    "Đội ngũ tổng đài viên luôn sẵn sàng hỗ trợ đổi vé, xử lý sự cố và giải đáp thắc mắc bất cứ lúc nào bạn cần.",
                badge: "Phản hồi nhanh chóng",
            },
        },
    },
};

export default hero;
