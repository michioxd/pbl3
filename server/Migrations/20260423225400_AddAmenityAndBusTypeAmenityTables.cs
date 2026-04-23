using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class AddAmenityAndBusTypeAmenityTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Amenities",
                table: "BusTypes");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "BusTypes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "BusTypes",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "BusTypes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "BusTypes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Amenities",
                columns: table => new
                {
                    AmenityID = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IconName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Amenities", x => x.AmenityID);
                });

            migrationBuilder.CreateTable(
                name: "BusTypeAmenities",
                columns: table => new
                {
                    BusTypeAmenityID = table.Column<Guid>(type: "uuid", nullable: false),
                    BusTypeID = table.Column<Guid>(type: "uuid", nullable: false),
                    AmenityID = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusTypeAmenities", x => x.BusTypeAmenityID);
                    table.ForeignKey(
                        name: "FK_BusTypeAmenities_Amenities_AmenityID",
                        column: x => x.AmenityID,
                        principalTable: "Amenities",
                        principalColumn: "AmenityID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BusTypeAmenities_BusTypes_BusTypeID",
                        column: x => x.BusTypeID,
                        principalTable: "BusTypes",
                        principalColumn: "BusTypeID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusTypeAmenities_AmenityID",
                table: "BusTypeAmenities",
                column: "AmenityID");

            migrationBuilder.CreateIndex(
                name: "IX_BusTypeAmenities_BusTypeID",
                table: "BusTypeAmenities",
                column: "BusTypeID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusTypeAmenities");

            migrationBuilder.DropTable(
                name: "Amenities");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "BusTypes");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "BusTypes");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "BusTypes",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "BusTypes",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Amenities",
                table: "BusTypes",
                type: "jsonb",
                nullable: false,
                defaultValue: "");
        }
    }
}
