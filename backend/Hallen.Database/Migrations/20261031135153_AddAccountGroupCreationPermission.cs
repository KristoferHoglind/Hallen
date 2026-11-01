using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hallen.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountGroupCreationPermission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CanCreateGroups",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CanCreateGroups",
                table: "AspNetUsers");
        }
    }
}
