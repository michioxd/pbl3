-- Seed script for busadmin: ssonhellonguyen1000@gmail.com
-- Please run this script in your PostgreSQL database.

DO $$
DECLARE
    v_role_id uuid;
    v_user_id uuid := gen_random_uuid();
    v_company_id uuid := gen_random_uuid();
    v_bus_type_id uuid := gen_random_uuid();
    v_bus_id uuid := gen_random_uuid();
    v_route_id uuid := gen_random_uuid();
    v_station_1_id uuid;
    v_station_2_id uuid;
    v_trip_id uuid := gen_random_uuid();
    v_seat_layout_1_id uuid := gen_random_uuid();
    v_seat_layout_2_id uuid := gen_random_uuid();
    v_passenger_1_id uuid := gen_random_uuid();
    v_passenger_2_id uuid := gen_random_uuid();
    v_booking_1_id uuid := gen_random_uuid();
    v_ticket_1_id uuid := gen_random_uuid();
    v_ticket_2_id uuid := gen_random_uuid();
BEGIN
    -- 1. Get or Create BusAdmin Role
    SELECT "RoleID" INTO v_role_id FROM "Roles" WHERE "RoleName" = 'BusAdmin' LIMIT 1;
    IF v_role_id IS NULL THEN
        v_role_id := gen_random_uuid();
        INSERT INTO "Roles" ("RoleID", "RoleName") VALUES (v_role_id, 'BusAdmin');
    END IF;

    -- 2. Create User if not exists
    SELECT "UserID" INTO v_user_id FROM "Users" WHERE "Email" = 'ssonhellonguyen1000@gmail.com' LIMIT 1;
    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        -- PasswordHash can be a dummy hash if they use external login or they can reset it.
        INSERT INTO "Users" ("UserID", "RoleID", "PasswordHash", "Email", "FullName", "PhoneNumber", "IsActive", "CreatedAt")
        VALUES (v_user_id, v_role_id, '', 'ssonhellonguyen1000@gmail.com', 'Ssonhello Nguyen', '0999999999', true, NOW());
    ELSE
        -- Ensure user has BusAdmin role
        UPDATE "Users" SET "RoleID" = v_role_id WHERE "UserID" = v_user_id;
    END IF;

    -- 3. Create Bus Company
    -- Try to find if user already has a company
    SELECT "CompanyID" INTO v_company_id FROM "BusCompanyAdmins" WHERE "UserID" = v_user_id LIMIT 1;
    
    IF v_company_id IS NULL THEN
        v_company_id := gen_random_uuid();
        INSERT INTO "BusCompanies" ("CompanyID", "Name", "LicenseNumber", "Hotline", "IsApproved")
        VALUES (v_company_id, 'Ssonhello Express', 'VN-SH-001', '19009999', true);

        -- 4. Create Bus Company Admin Link (O = Owner)
        INSERT INTO "BusCompanyAdmins" ("UserID", "CompanyID", "Roles")
        VALUES (v_user_id, v_company_id, 'O');
    END IF;

    -- 5. Create Bus Type (if need dummy data)
    INSERT INTO "BusTypes" ("BusTypeID", "Name", "TotalSeats", "Description")
    VALUES (v_bus_type_id, 'Giường nằm VIP 34 chỗ (Ssonhello)', 34, 'Xe giường nằm cao cấp Ssonhello');

    -- 6. Create Bus
    INSERT INTO "Buses" ("BusID", "CompanyID", "BusTypeID", "PlateNumber", "IsActive")
    VALUES (v_bus_id, v_company_id, v_bus_type_id, '51B-999.99', true);

    -- 7. Get some random stations to create a route
    SELECT "StationID" INTO v_station_1_id FROM "Stations" LIMIT 1;
    SELECT "StationID" INTO v_station_2_id FROM "Stations" WHERE "StationID" != v_station_1_id LIMIT 1;

    -- Only create route if we have stations
    IF v_station_1_id IS NOT NULL AND v_station_2_id IS NOT NULL THEN
        -- 8. Create Route
        INSERT INTO "BusRoutes" ("RouteID", "CompanyID", "RouteName", "DistanceEstimate", "DurationEstimate", "IsActive")
        VALUES (v_route_id, v_company_id, 'Sài Gòn - Đà Lạt (Ssonhello)', 300.0, 480.0, true);

        -- 9. Create Route Stops
        INSERT INTO "RouteStops" ("BusRouteStopID", "RouteID", "StationID", "StopOrder", "IsPickUp", "IsDropOff", "DurationFromStart")
        VALUES (gen_random_uuid(), v_route_id, v_station_1_id, 1, true, false, 0);

        INSERT INTO "RouteStops" ("BusRouteStopID", "RouteID", "StationID", "StopOrder", "IsPickUp", "IsDropOff", "DurationFromStart")
        VALUES (gen_random_uuid(), v_route_id, v_station_2_id, 2, false, true, 480);

        -- 10. Create Trip (enum trip_status maps to int: 0 = scheduled)
        INSERT INTO "Trips" ("TripID", "RouteID", "BusID", "BusTypeID", "DepartureDate", "DepartureTime", "ArrivalTime", "Status")
        VALUES (v_trip_id, v_route_id, v_bus_id, v_bus_type_id, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '8 hours', 0);

        -- 11. Create Seat Layouts
        INSERT INTO "SeatLayouts" ("LayoutID", "BusTypeID", "SeatLabel", "Floor", "SeatType", "PositionX", "PositionY")
        VALUES (v_seat_layout_1_id, v_bus_type_id, 'A1', 1, 0, 1, 1); -- SeatType: 0 = Window

        INSERT INTO "SeatLayouts" ("LayoutID", "BusTypeID", "SeatLabel", "Floor", "SeatType", "PositionX", "PositionY")
        VALUES (v_seat_layout_2_id, v_bus_type_id, 'A2', 1, 1, 1, 2); -- SeatType: 1 = Aisle

        -- 12. Create Passengers for the User
        INSERT INTO "Passengers" ("PassengerID", "UserID", "FullName", "PhoneNumber", "IdentityCard", "Email")
        VALUES (v_passenger_1_id, v_user_id, 'Ssonhello Passenger 1', '0901234567', '012345678911', 'passenger1@example.com');

        INSERT INTO "Passengers" ("PassengerID", "UserID", "FullName", "PhoneNumber", "IdentityCard", "Email")
        VALUES (v_passenger_2_id, v_user_id, 'Ssonhello Passenger 2', '0901234568', '012345678912', 'passenger2@example.com');

        -- 13. Create Booking
        -- BookingStatus: 1 = Paid
        INSERT INTO "Bookings" ("BookingID", "UserID", "ContactName", "ContactPhone", "ContactEmail", "TotalAmount", "Status", "CreatedAt", "ExpiresAt")
        VALUES (v_booking_1_id, v_user_id, 'Ssonhello Nguyen', '0999999999', 'ssonhellonguyen1000@gmail.com', 500000.0, 1, CURRENT_TIMESTAMP, NULL);

        -- 14. Create Tickets
        -- TicketStatus: 0 = Issued
        INSERT INTO "Tickets" ("TicketID", "BookingID", "TripID", "PassengerID", "SeatLayoutID", "FinalPrice", "Status", "TicketCode", "QrCode")
        VALUES (v_ticket_1_id, v_booking_1_id, v_trip_id, v_passenger_1_id, v_seat_layout_1_id, 250000.0, 0, 'TCK-SH-001', 'qrcode1');

        INSERT INTO "Tickets" ("TicketID", "BookingID", "TripID", "PassengerID", "SeatLayoutID", "FinalPrice", "Status", "TicketCode", "QrCode")
        VALUES (v_ticket_2_id, v_booking_1_id, v_trip_id, v_passenger_2_id, v_seat_layout_2_id, 250000.0, 0, 'TCK-SH-002', 'qrcode2');
    END IF;

    RAISE NOTICE 'Successfully inserted mock data for ssonhellonguyen1000@gmail.com';
END $$;
