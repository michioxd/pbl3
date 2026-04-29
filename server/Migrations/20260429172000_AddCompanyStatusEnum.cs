using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyStatusEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add Status column as nullable initially
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "BusCompanies",
                type: "integer",
                nullable: true
            );

            // Migrate existing data: IsApproved=true → Status=1 (Approved), IsApproved=false → Status=0 (Pending)
            migrationBuilder.Sql(
                @"
                UPDATE ""BusCompanies""
                SET ""Status"" = CASE
                    WHEN ""IsApproved"" = true THEN 1
                    ELSE 0
                END
            "
            );

            // Make Status column NOT NULL with default Pending (0)
            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "BusCompanies",
                type: "integer",
                nullable: false,
                defaultValue: 0
            );

            // Add CreatedAt column with default current timestamp
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "BusCompanies",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()"
            );

            // Add indexes for performance
            migrationBuilder.CreateIndex(
                name: "IX_BusCompanies_Status",
                table: "BusCompanies",
                column: "Status"
            );

            migrationBuilder.CreateIndex(
                name: "IX_BusCompanies_CreatedAt",
                table: "BusCompanies",
                column: "CreatedAt"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_BusCompanies_CreatedAt", table: "BusCompanies");

            migrationBuilder.DropIndex(name: "IX_BusCompanies_Status", table: "BusCompanies");

            migrationBuilder.DropColumn(name: "CreatedAt", table: "BusCompanies");

            migrationBuilder.DropColumn(name: "Status", table: "BusCompanies");
        }
    }
}
