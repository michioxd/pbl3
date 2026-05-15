-- Script to populate location codes for existing routes
-- Run this after applying the AddRouteLocationCodes migration

UPDATE "BusRoutes" r
SET
    departure_province_code = dep_station."province_code",
    departure_district_code = dep_station."district_code",
    departure_ward_code = dep_station."ward_code",
    arrival_province_code = arr_station."province_code",
    arrival_district_code = arr_station."district_code",
    arrival_ward_code = arr_station."ward_code"
FROM (
    SELECT
        rs."RouteID",
        s."province_code",
        s."district_code",
        s."ward_code",
        ROW_NUMBER() OVER (PARTITION BY rs."RouteID" ORDER BY rs."StopOrder") as rn
    FROM "RouteStops" rs
    JOIN "Stations" s ON rs."StationID" = s."StationID"
    WHERE rs."IsPickUp" = true
) dep_station
JOIN (
    SELECT
        rs."RouteID",
        s."province_code",
        s."district_code",
        s."ward_code",
        ROW_NUMBER() OVER (PARTITION BY rs."RouteID" ORDER BY rs."StopOrder" DESC) as rn
    FROM "RouteStops" rs
    JOIN "Stations" s ON rs."StationID" = s."StationID"
    WHERE rs."IsDropOff" = true
) arr_station ON dep_station."RouteID" = arr_station."RouteID"
WHERE
    r."RouteID" = dep_station."RouteID"
    AND dep_station.rn = 1
    AND arr_station.rn = 1;
