using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hallen.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddGameMatchTeamPlayers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GameMatchTeamPlayers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GameMatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    GameTeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlayerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameMatchTeamPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GameMatchTeamPlayers_game_matches_GameMatchId",
                        column: x => x.GameMatchId,
                        principalTable: "game_matches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GameMatchTeamPlayers_game_teams_GameTeamId",
                        column: x => x.GameTeamId,
                        principalTable: "game_teams",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GameMatchTeamPlayers_players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GameMatchTeamPlayers_GameMatchId_GameTeamId_PlayerId",
                table: "GameMatchTeamPlayers",
                columns: new[] { "GameMatchId", "GameTeamId", "PlayerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GameMatchTeamPlayers_GameTeamId",
                table: "GameMatchTeamPlayers",
                column: "GameTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_GameMatchTeamPlayers_PlayerId",
                table: "GameMatchTeamPlayers",
                column: "PlayerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GameMatchTeamPlayers");
        }
    }
}
