using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class AddBusCompanyPayOnBoard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowPayOnBoard",
                table: "CompanyProfileUpdateRequests",
                type: "boolean",
                nullable: false,
                defaultValue: true
            );

            migrationBuilder.AddColumn<bool>(
                name: "AllowPayOnBoard",
                table: "BusCompanies",
                type: "boolean",
                nullable: false,
                defaultValue: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowPayOnBoard",
                table: "CompanyProfileUpdateRequests"
            );

            migrationBuilder.DropColumn(name: "AllowPayOnBoard", table: "BusCompanies");
        }
    }
}
