using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hallen.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddSportsGroupDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "sports_groups",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "sports_groups");
        }
    }
}
