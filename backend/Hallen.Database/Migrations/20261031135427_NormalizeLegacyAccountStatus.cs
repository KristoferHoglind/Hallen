using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hallen.Database.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeLegacyAccountStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Older installations received an empty status when this field was introduced.
            migrationBuilder.Sql("""UPDATE "AspNetUsers" SET "Status" = 'Active' WHERE "Status" = '';""");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Do not restore invalid statuses or change explicitly disabled accounts.

        }
    }
}
