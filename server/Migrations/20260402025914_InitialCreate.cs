using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder
                .AlterDatabase()
                .Annotation("Npgsql:Enum:booking_status", "pending,paid,cancelled,refunded")
                .Annotation("Npgsql:Enum:notification_status", "sent,failed")
                .Annotation("Npgsql:Enum:notification_type", "email,sms,push")
                .Annotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .Annotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .Annotation("Npgsql:Enum:refund_status", "pending,processed")
                .Annotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .Annotation(
                    "Npgsql:Enum:seat_type",
                    "window,aisle,middle,driver,upper_deck,lower_deck"
                )
                .Annotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .Annotation("Npgsql:Enum:ticket_status", "issued,checked_in,cancelled")
                .Annotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .Annotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin");

            migrationBuilder.CreateTable(
                name: "administrative_regions",
                columns: table => new
                {
                    id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    name = table.Column<string>(type: "text", nullable: false),
                    name_en = table.Column<string>(type: "text", nullable: false),
                    code_name = table.Column<string>(type: "text", nullable: true),
                    code_name_en = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_administrative_regions", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "administrative_units",
                columns: table => new
                {
                    id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    full_name = table.Column<string>(type: "text", nullable: true),
                    full_name_en = table.Column<string>(type: "text", nullable: true),
                    short_name = table.Column<string>(type: "text", nullable: true),
                    short_name_en = table.Column<string>(type: "text", nullable: true),
                    code_name = table.Column<string>(type: "text", nullable: true),
                    code_name_en = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_administrative_units", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "BusCompanies",
                columns: table => new
                {
                    CompanyID = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    LicenseNumber = table.Column<string>(type: "text", nullable: true),
                    Hotline = table.Column<string>(type: "text", nullable: true),
                    IsApproved = table.Column<bool>(type: "boolean", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusCompanies", x => x.CompanyID);
                }
            );

            migrationBuilder.CreateTable(
                name: "BusTypes",
                columns: table => new
                {
                    BusTypeID = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    TotalSeats = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusTypes", x => x.BusTypeID);
                }
            );

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    RoleID = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleName = table.Column<string>(type: "text", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.RoleID);
                }
            );

            migrationBuilder.CreateTable(
                name: "provinces",
                columns: table => new
                {
                    code = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    name_en = table.Column<string>(type: "text", nullable: true),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    full_name_en = table.Column<string>(type: "text", nullable: true),
                    code_name = table.Column<string>(type: "text", nullable: true),
                    administrative_unit_id = table.Column<int>(type: "integer", nullable: true),
                    administrative_region_id = table.Column<int>(type: "integer", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_provinces", x => x.code);
                    table.ForeignKey(
                        name: "FK_provinces_administrative_regions_administrative_region_id",
                        column: x => x.administrative_region_id,
                        principalTable: "administrative_regions",
                        principalColumn: "id"
                    );
                    table.ForeignKey(
                        name: "FK_provinces_administrative_units_administrative_unit_id",
                        column: x => x.administrative_unit_id,
                        principalTable: "administrative_units",
                        principalColumn: "id"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "BusRoutes",
                columns: table => new
                {
                    RouteID = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyID = table.Column<Guid>(type: "uuid", nullable: false),
                    RouteName = table.Column<string>(type: "text", nullable: false),
                    DistanceEstimate = table.Column<decimal>(type: "numeric", nullable: false),
                    DurationEstimate = table.Column<decimal>(type: "numeric", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusRoutes", x => x.RouteID);
                    table.ForeignKey(
                        name: "FK_BusRoutes_BusCompanies_CompanyID",
                        column: x => x.CompanyID,
                        principalTable: "BusCompanies",
                        principalColumn: "CompanyID",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Buses",
                columns: table => new
                {
                    BusID = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyID = table.Column<Guid>(type: "uuid", nullable: false),
                    BusCompanyCompanyID = table.Column<Guid>(type: "uuid", nullable: true),
                    BusTypeID = table.Column<Guid>(type: "uuid", nullable: false),
                    PlateNumber = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Buses", x => x.BusID);
                    table.ForeignKey(
                        name: "FK_Buses_BusCompanies_BusCompanyCompanyID",
                        column: x => x.BusCompanyCompanyID,
                        principalTable: "BusCompanies",
                        principalColumn: "CompanyID"
                    );
                    table.ForeignKey(
                        name: "FK_Buses_BusTypes_BusTypeID",
                        column: x => x.BusTypeID,
                        principalTable: "BusTypes",
                        principalColumn: "BusTypeID",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "SeatLayouts",
                columns: table => new
                {
                    LayoutID = table.Column<Guid>(type: "uuid", nullable: false),
                    BusTypeID = table.Column<Guid>(type: "uuid", nullable: false),
                    SeatLabel = table.Column<string>(type: "text", nullable: false),
                    Floor = table.Column<int>(type: "integer", nullable: false),
                    SeatType = table.Column<int>(type: "integer", nullable: false),
                    PositionX = table.Column<int>(type: "integer", nullable: false),
                    PositionY = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeatLayouts", x => x.LayoutID);
                    table.ForeignKey(
                        name: "FK_SeatLayouts_BusTypes_BusTypeID",
                        column: x => x.BusTypeID,
                        principalTable: "BusTypes",
                        principalColumn: "BusTypeID",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserID = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleID = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserID);
                    table.ForeignKey(
                        name: "FK_Users_Roles_RoleID",
                        column: x => x.RoleID,
                        principalTable: "Roles",
                        principalColumn: "RoleID",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "districts",
                columns: table => new
                {
                    code = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    name_en = table.Column<string>(type: "text", nullable: true),
                    full_name = table.Column<string>(type: "text", nullable: true),
                    full_name_en = table.Column<string>(type: "text", nullable: true),
                    code_name = table.Column<string>(type: "text", nullable: true),
                    province_code = table.Column<string>(type: "text", nullable: true),
                    administrative_unit_id = table.Column<int>(type: "integer", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_districts", x => x.code);
                    table.ForeignKey(
                        name: "FK_districts_administrative_units_administrative_unit_id",
                        column: x => x.administrative_unit_id,
                        principalTable: "administrative_units",
                        principalColumn: "id"
                    );
                    table.ForeignKey(
                        name: "FK_districts_provinces_province_code",
                        column: x => x.province_code,
                        principalTable: "provinces",
                        principalColumn: "code"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "BusImages",
                columns: table => new
                {
                    ImageID = table.Column<Guid>(type: "uuid", nullable: false),
                    BusID = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageURL = table.Column<string>(type: "text", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusImages", x => x.ImageID);
                    table.ForeignKey(
                        name: "FK_BusImages_Buses_BusID",
                        column: x => x.BusID,
                        principalTable: "Buses",
                        principalColumn: "BusID",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Trips",
                columns: table => new
                {
                    TripID = table.Column<Guid>(type: "uuid", nullable: false),
                    RouteID = table.Column<Guid>(type: "uuid", nullable: false),
                    BusID = table.Column<Guid>(type: "uuid", nullable: true),
                    BusTypeID = table.Column<Guid>(type: "uuid", nullable: false),
                    DepartureDate = table.Column<DateOnly>(type: "date", nullable: false),
                    DepartureTime = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    ArrivalTime = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    Status = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trips", x => x.TripID);
                    table.ForeignKey(
                        name: "FK_Trips_BusRoutes_RouteID",
                        column: x => x.RouteID,
                        principalTable: "BusRoutes",
                        principalColumn: "RouteID",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_Trips_BusTypes_BusTypeID",
                        column: x => x.BusTypeID,
                        principalTable: "BusTypes",
                        principalColumn: "BusTypeID",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_Trips_Buses_BusID",
                        column: x => x.BusID,
                        principalTable: "Buses",
                        principalColumn: "BusID"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    BookingID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<Guid>(type: "uuid", nullable: true),
                    ContactName = table.Column<string>(type: "text", nullable: false),
                    ContactPhone = table.Column<string>(type: "text", nullable: false),
                    ContactEmail = table.Column<string>(type: "text", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    ExpiresAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.BookingID);
                    table.ForeignKey(
                        name: "FK_Bookings_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.SetNull
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "BusCompanyAdmins",
                columns: table => new
                {
                    UserID = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyID = table.Column<Guid>(type: "uuid", nullable: false),
                    BusCompanyCompanyID = table.Column<Guid>(type: "uuid", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusCompanyAdmins", x => x.UserID);
                    table.ForeignKey(
                        name: "FK_BusCompanyAdmins_BusCompanies_BusCompanyCompanyID",
                        column: x => x.BusCompanyCompanyID,
                        principalTable: "BusCompanies",
                        principalColumn: "CompanyID"
                    );
                    table.ForeignKey(
                        name: "FK_BusCompanyAdmins_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Passengers",
                columns: table => new
                {
                    PassengerID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<Guid>(type: "uuid", nullable: true),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    IdentityCard = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Passengers", x => x.PassengerID);
                    table.ForeignKey(
                        name: "FK_Passengers_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "wards",
                columns: table => new
                {
                    code = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    name_en = table.Column<string>(type: "text", nullable: true),
                    full_name = table.Column<string>(type: "text", nullable: true),
                    full_name_en = table.Column<string>(type: "text", nullable: true),
                    code_name = table.Column<string>(type: "text", nullable: true),
                    district_code = table.Column<string>(type: "text", nullable: true),
                    administrative_unit_id = table.Column<int>(type: "integer", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wards", x => x.code);
                    table.ForeignKey(
                        name: "FK_wards_administrative_units_administrative_unit_id",
                        column: x => x.administrative_unit_id,
                        principalTable: "administrative_units",
                        principalColumn: "id"
                    );
                    table.ForeignKey(
                        name: "FK_wards_districts_district_code",
                        column: x => x.district_code,
                        principalTable: "districts",
                        principalColumn: "code"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "SeatHolds",
                columns: table => new
                {
                    HoldID = table.Column<Guid>(type: "uuid", nullable: false),
                    TripID = table.Column<Guid>(type: "uuid", nullable: false),
                    SeatLayoutID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<Guid>(type: "uuid", nullable: true),
                    SessionID = table.Column<string>(type: "text", nullable: true),
                    ExpiresAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    Status = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeatHolds", x => x.HoldID);
                    table.ForeignKey(
                        name: "FK_SeatHolds_SeatLayouts_SeatLayoutID",
                        column: x => x.SeatLayoutID,
                        principalTable: "SeatLayouts",
                        principalColumn: "LayoutID",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_SeatHolds_Trips_TripID",
                        column: x => x.TripID,
                        principalTable: "Trips",
                        principalColumn: "TripID",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_SeatHolds_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    NotifID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingID = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.NotifID);
                    table.ForeignKey(
                        name: "FK_Notifications_Bookings_BookingID",
                        column: x => x.BookingID,
                        principalTable: "Bookings",
                        principalColumn: "BookingID",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "PaymentIntents",
                columns: table => new
                {
                    IntentID = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingID = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentIntents", x => x.IntentID);
                    table.ForeignKey(
                        name: "FK_PaymentIntents_Bookings_BookingID",
                        column: x => x.BookingID,
                        principalTable: "Bookings",
                        principalColumn: "BookingID",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    ReviewID = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingID = table.Column<Guid>(type: "uuid", nullable: false),
                    TripID = table.Column<Guid>(type: "uuid", nullable: false),
                    RatingScore = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.ReviewID);
                    table.ForeignKey(
                        name: "FK_Reviews_Bookings_BookingID",
                        column: x => x.BookingID,
                        principalTable: "Bookings",
                        principalColumn: "BookingID",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_Reviews_Trips_TripID",
                        column: x => x.TripID,
                        principalTable: "Trips",
                        principalColumn: "TripID",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    TicketID = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingID = table.Column<Guid>(type: "uuid", nullable: false),
                    TripID = table.Column<Guid>(type: "uuid", nullable: false),
                    PassengerID = table.Column<Guid>(type: "uuid", nullable: false),
                    SeatLayoutID = table.Column<Guid>(type: "uuid", nullable: false),
                    FinalPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    TicketCode = table.Column<string>(type: "text", nullable: false),
                    QrCode = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.TicketID);
                    table.ForeignKey(
                        name: "FK_Tickets_Bookings_BookingID",
                        column: x => x.BookingID,
                        principalTable: "Bookings",
                        principalColumn: "BookingID",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_Tickets_Passengers_PassengerID",
                        column: x => x.PassengerID,
                        principalTable: "Passengers",
                        principalColumn: "PassengerID",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "FK_Tickets_SeatLayouts_SeatLayoutID",
                        column: x => x.SeatLayoutID,
                        principalTable: "SeatLayouts",
                        principalColumn: "LayoutID",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_Tickets_Trips_TripID",
                        column: x => x.TripID,
                        principalTable: "Trips",
                        principalColumn: "TripID",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Stations",
                columns: table => new
                {
                    StationID = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    AddressDetail = table.Column<string>(type: "text", nullable: true),
                    province_code = table.Column<string>(type: "text", nullable: true),
                    district_code = table.Column<string>(type: "text", nullable: true),
                    ward_code = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stations", x => x.StationID);
                    table.ForeignKey(
                        name: "FK_Stations_districts_district_code",
                        column: x => x.district_code,
                        principalTable: "districts",
                        principalColumn: "code",
                        onDelete: ReferentialAction.SetNull
                    );
                    table.ForeignKey(
                        name: "FK_Stations_provinces_province_code",
                        column: x => x.province_code,
                        principalTable: "provinces",
                        principalColumn: "code",
                        onDelete: ReferentialAction.SetNull
                    );
                    table.ForeignKey(
                        name: "FK_Stations_wards_ward_code",
                        column: x => x.ward_code,
                        principalTable: "wards",
                        principalColumn: "code",
                        onDelete: ReferentialAction.SetNull
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Refunds",
                columns: table => new
                {
                    RefundID = table.Column<Guid>(type: "uuid", nullable: false),
                    IntentID = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Refunds", x => x.RefundID);
                    table.ForeignKey(
                        name: "FK_Refunds_PaymentIntents_IntentID",
                        column: x => x.IntentID,
                        principalTable: "PaymentIntents",
                        principalColumn: "IntentID",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "RouteStops",
                columns: table => new
                {
                    BusRouteStopID = table.Column<Guid>(type: "uuid", nullable: false),
                    RouteID = table.Column<Guid>(type: "uuid", nullable: false),
                    StationID = table.Column<Guid>(type: "uuid", nullable: false),
                    StopOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPickUp = table.Column<bool>(type: "boolean", nullable: false),
                    IsDropOff = table.Column<bool>(type: "boolean", nullable: false),
                    DurationFromStart = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RouteStops", x => x.BusRouteStopID);
                    table.ForeignKey(
                        name: "FK_RouteStops_BusRoutes_RouteID",
                        column: x => x.RouteID,
                        principalTable: "BusRoutes",
                        principalColumn: "RouteID",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_RouteStops_Stations_StationID",
                        column: x => x.StationID,
                        principalTable: "Stations",
                        principalColumn: "StationID",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_UserID",
                table: "Bookings",
                column: "UserID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_BusCompanyAdmins_BusCompanyCompanyID",
                table: "BusCompanyAdmins",
                column: "BusCompanyCompanyID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Buses_BusCompanyCompanyID",
                table: "Buses",
                column: "BusCompanyCompanyID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Buses_BusTypeID",
                table: "Buses",
                column: "BusTypeID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_BusImages_BusID",
                table: "BusImages",
                column: "BusID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_BusRoutes_CompanyID",
                table: "BusRoutes",
                column: "CompanyID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_districts_administrative_unit_id",
                table: "districts",
                column: "administrative_unit_id"
            );

            migrationBuilder.CreateIndex(
                name: "IX_districts_province_code",
                table: "districts",
                column: "province_code"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_BookingID",
                table: "Notifications",
                column: "BookingID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserID",
                table: "Notifications",
                column: "UserID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Passengers_UserID",
                table: "Passengers",
                column: "UserID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_PaymentIntents_BookingID",
                table: "PaymentIntents",
                column: "BookingID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_provinces_administrative_region_id",
                table: "provinces",
                column: "administrative_region_id"
            );

            migrationBuilder.CreateIndex(
                name: "IX_provinces_administrative_unit_id",
                table: "provinces",
                column: "administrative_unit_id"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_IntentID",
                table: "Refunds",
                column: "IntentID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookingID",
                table: "Reviews",
                column: "BookingID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_TripID",
                table: "Reviews",
                column: "TripID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_RouteStops_RouteID",
                table: "RouteStops",
                column: "RouteID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_RouteStops_StationID",
                table: "RouteStops",
                column: "StationID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_SeatHolds_SeatLayoutID",
                table: "SeatHolds",
                column: "SeatLayoutID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_SeatHolds_TripID",
                table: "SeatHolds",
                column: "TripID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_SeatHolds_UserID",
                table: "SeatHolds",
                column: "UserID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_SeatLayouts_BusTypeID",
                table: "SeatLayouts",
                column: "BusTypeID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Stations_district_code",
                table: "Stations",
                column: "district_code"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Stations_province_code",
                table: "Stations",
                column: "province_code"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Stations_ward_code",
                table: "Stations",
                column: "ward_code"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_BookingID",
                table: "Tickets",
                column: "BookingID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_PassengerID",
                table: "Tickets",
                column: "PassengerID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_SeatLayoutID",
                table: "Tickets",
                column: "SeatLayoutID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TripID",
                table: "Tickets",
                column: "TripID"
            );

            migrationBuilder.CreateIndex(name: "IX_Trips_BusID", table: "Trips", column: "BusID");

            migrationBuilder.CreateIndex(
                name: "IX_Trips_BusTypeID",
                table: "Trips",
                column: "BusTypeID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Trips_RouteID",
                table: "Trips",
                column: "RouteID"
            );

            migrationBuilder.CreateIndex(name: "IX_Users_RoleID", table: "Users", column: "RoleID");

            migrationBuilder.CreateIndex(
                name: "IX_wards_administrative_unit_id",
                table: "wards",
                column: "administrative_unit_id"
            );

            migrationBuilder.CreateIndex(
                name: "IX_wards_district_code",
                table: "wards",
                column: "district_code"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "BusCompanyAdmins");

            migrationBuilder.DropTable(name: "BusImages");

            migrationBuilder.DropTable(name: "Notifications");

            migrationBuilder.DropTable(name: "Refunds");

            migrationBuilder.DropTable(name: "Reviews");

            migrationBuilder.DropTable(name: "RouteStops");

            migrationBuilder.DropTable(name: "SeatHolds");

            migrationBuilder.DropTable(name: "Tickets");

            migrationBuilder.DropTable(name: "PaymentIntents");

            migrationBuilder.DropTable(name: "Stations");

            migrationBuilder.DropTable(name: "Passengers");

            migrationBuilder.DropTable(name: "SeatLayouts");

            migrationBuilder.DropTable(name: "Trips");

            migrationBuilder.DropTable(name: "Bookings");

            migrationBuilder.DropTable(name: "wards");

            migrationBuilder.DropTable(name: "BusRoutes");

            migrationBuilder.DropTable(name: "Buses");

            migrationBuilder.DropTable(name: "Users");

            migrationBuilder.DropTable(name: "districts");

            migrationBuilder.DropTable(name: "BusCompanies");

            migrationBuilder.DropTable(name: "BusTypes");

            migrationBuilder.DropTable(name: "Roles");

            migrationBuilder.DropTable(name: "provinces");

            migrationBuilder.DropTable(name: "administrative_regions");

            migrationBuilder.DropTable(name: "administrative_units");
        }
    }
}
