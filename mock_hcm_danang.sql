-- Script tạo dữ liệu Trip, Route, Station, Booking, Ticket cho tuyến "Hồ Chí Minh - Đà Nẵng"
-- Dành cho nhà xe Ssonhello Express (ssonhellonguyen1000@gmail.com)

DO $$
DECLARE
    v_user_id uuid;
    v_company_id uuid;
    v_bus_type_id uuid;
    v_bus_id uuid;
    v_route_id uuid := '44dab144-6b3f-4572-8624-0a6019830568';
    v_station_hcm_id uuid;
    v_station_dn_id uuid;
    v_trip_id uuid := gen_random_uuid();
    v_seat_layout_1_id uuid := gen_random_uuid();
    v_seat_layout_2_id uuid := gen_random_uuid();
    v_seat_layout_3_id uuid := gen_random_uuid();
    v_passenger_1_id uuid := gen_random_uuid();
    v_passenger_2_id uuid := gen_random_uuid();
    v_booking_1_id uuid := gen_random_uuid();
    v_ticket_1_id uuid := gen_random_uuid();
    v_ticket_2_id uuid := gen_random_uuid();
BEGIN
    -- 1. Lấy thông tin user hiện tại
    SELECT "UserID" INTO v_user_id FROM "Users" WHERE "Email" = 'ssonhellonguyen1000@gmail.com' LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy user ssonhellonguyen1000@gmail.com, vui lòng chạy bosungsql.sql trước.';
    END IF;

    -- 2. Lấy thông tin nhà xe của user
    SELECT "CompanyID" INTO v_company_id FROM "BusCompanyAdmins" WHERE "UserID" = v_user_id LIMIT 1;
    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy nhà xe của user.';
    END IF;

    -- 3. Tạo trạm Hồ Chí Minh nếu chưa có
    SELECT "StationID" INTO v_station_hcm_id FROM "Stations" WHERE "Name" ILIKE '%Hồ Chí Minh%' LIMIT 1;
    IF v_station_hcm_id IS NULL THEN
        v_station_hcm_id := gen_random_uuid();
        INSERT INTO "Stations" ("StationID", "Name", "province_code", "district_code", "ward_code", "AddressDetail", "Type")
        VALUES (v_station_hcm_id, 'Bến xe Miền Đông (Hồ Chí Minh)', '79', '764', '26734', 'Đinh Bộ Lĩnh, Bình Thạnh', 0);
    END IF;

    -- 4. Tạo trạm Đà Nẵng nếu chưa có
    SELECT "StationID" INTO v_station_dn_id FROM "Stations" WHERE "Name" ILIKE '%Đà Nẵng%' LIMIT 1;
    IF v_station_dn_id IS NULL THEN
        v_station_dn_id := gen_random_uuid();
        INSERT INTO "Stations" ("StationID", "Name", "province_code", "district_code", "ward_code", "AddressDetail", "Type")
        VALUES (v_station_dn_id, 'Bến xe Trung tâm Đà Nẵng', '48', '490', '20194', 'Tôn Đức Thắng, Liên Chiểu', 0);
    END IF;

    -- 5. Lấy hoặc tạo BusType (Xe giường nằm VIP)
    SELECT "BusTypeID" INTO v_bus_type_id FROM "BusTypes" LIMIT 1;
    IF v_bus_type_id IS NULL THEN
        v_bus_type_id := gen_random_uuid();
        INSERT INTO "BusTypes" ("BusTypeID", "Name", "TotalSeats", "Description")
        VALUES (v_bus_type_id, 'Giường nằm Limousine 34 chỗ', 34, 'Limousine đời mới');
    END IF;

    -- 6. Lấy hoặc tạo Bus
    SELECT "BusID" INTO v_bus_id FROM "Buses" WHERE "CompanyID" = v_company_id LIMIT 1;
    IF v_bus_id IS NULL THEN
        v_bus_id := gen_random_uuid();
        INSERT INTO "Buses" ("BusID", "CompanyID", "BusTypeID", "PlateNumber", "IsActive")
        VALUES (v_bus_id, v_company_id, v_bus_type_id, '51B-888.88', true);
    END IF;

    -- 7. Tạo Route: Hồ Chí Minh - Đà Nẵng (Nếu chưa tồn tại)
    IF NOT EXISTS (SELECT 1 FROM "BusRoutes" WHERE "RouteID" = v_route_id) THEN
        INSERT INTO "BusRoutes" ("RouteID", "CompanyID", "RouteName", "DistanceEstimate", "DurationEstimate", "IsActive")
        VALUES (v_route_id, v_company_id, 'Hồ Chí Minh - Đà Nẵng', 960.0, 1080.0, true);

        -- 8. Tạo Route Stops
        INSERT INTO "RouteStops" ("BusRouteStopID", "RouteID", "StationID", "StopOrder", "IsPickUp", "IsDropOff", "DurationFromStart")
        VALUES (gen_random_uuid(), v_route_id, v_station_hcm_id, 1, true, false, 0);

        INSERT INTO "RouteStops" ("BusRouteStopID", "RouteID", "StationID", "StopOrder", "IsPickUp", "IsDropOff", "DurationFromStart")
        VALUES (gen_random_uuid(), v_route_id, v_station_dn_id, 2, false, true, 1080);
    END IF;

    -- 9. Tạo Trip (Khởi hành vào ngày mai)
    INSERT INTO "Trips" ("TripID", "RouteID", "BusID", "BusTypeID", "DepartureDate", "DepartureTime", "ArrivalTime", "Status", "BasePrice")
    VALUES (
        v_trip_id, 
        v_route_id, 
        v_bus_id, 
        v_bus_type_id, 
        CURRENT_DATE + interval '1 day', 
        CURRENT_TIMESTAMP + interval '1 day', 
        CURRENT_TIMESTAMP + interval '1 day' + interval '18 hours', 
        0, -- 0 = Scheduled
        400000.0
    );

    -- 10. Tạo một số Seat Layouts (Sơ đồ ghế) cho BusType này (nếu chưa có)
    -- Giả sử tạo 3 ghế: A1, A2, A3
    INSERT INTO "SeatLayouts" ("LayoutID", "BusTypeID", "SeatLabel", "Floor", "SeatType", "PositionX", "PositionY")
    VALUES (v_seat_layout_1_id, v_bus_type_id, 'A1', 1, 0, 1, 1) ON CONFLICT DO NOTHING;

    INSERT INTO "SeatLayouts" ("LayoutID", "BusTypeID", "SeatLabel", "Floor", "SeatType", "PositionX", "PositionY")
    VALUES (v_seat_layout_2_id, v_bus_type_id, 'A2', 1, 1, 1, 2) ON CONFLICT DO NOTHING;
    
    INSERT INTO "SeatLayouts" ("LayoutID", "BusTypeID", "SeatLabel", "Floor", "SeatType", "PositionX", "PositionY")
    VALUES (v_seat_layout_3_id, v_bus_type_id, 'A3', 1, 0, 1, 3) ON CONFLICT DO NOTHING;

    -- 11. Tạo Passengers
    INSERT INTO "Passengers" ("PassengerID", "UserID", "FullName", "PhoneNumber", "IdentityCard", "Email")
    VALUES (v_passenger_1_id, v_user_id, 'Nguyễn Văn A', '0901234111', '012345678111', 'nva@example.com');

    INSERT INTO "Passengers" ("PassengerID", "UserID", "FullName", "PhoneNumber", "IdentityCard", "Email")
    VALUES (v_passenger_2_id, v_user_id, 'Trần Thị B', '0901234222', '012345678222', 'ttb@example.com');

    -- 12. Tạo Booking
    -- BookingStatus: 1 = Paid
    INSERT INTO "Bookings" ("BookingID", "UserID", "ContactName", "ContactPhone", "ContactEmail", "TotalAmount", "Status", "CreatedAt")
    VALUES (v_booking_1_id, v_user_id, 'Nguyễn Văn A', '0901234111', 'nva@example.com', 800000.0, 1, CURRENT_TIMESTAMP);

    -- 13. Tạo Tickets
    -- TicketStatus: 0 = Issued
    -- Giá vé Hồ Chí Minh - Đà Nẵng: 400.000 / vé
    INSERT INTO "Tickets" ("TicketID", "BookingID", "TripID", "PassengerID", "SeatLayoutID", "FinalPrice", "Status", "TicketCode", "QrCode")
    VALUES (v_ticket_1_id, v_booking_1_id, v_trip_id, v_passenger_1_id, v_seat_layout_1_id, 400000.0, 0, 'TCK-HCMDAD-01', 'qrhcmdad01');

    INSERT INTO "Tickets" ("TicketID", "BookingID", "TripID", "PassengerID", "SeatLayoutID", "FinalPrice", "Status", "TicketCode", "QrCode")
    VALUES (v_ticket_2_id, v_booking_1_id, v_trip_id, v_passenger_2_id, v_seat_layout_2_id, 400000.0, 0, 'TCK-HCMDAD-02', 'qrhcmdad02');

    RAISE NOTICE 'Đã tạo thành công dữ liệu tuyến Hồ Chí Minh - Đà Nẵng, chuyến đi, booking và vé!';
END $$;
