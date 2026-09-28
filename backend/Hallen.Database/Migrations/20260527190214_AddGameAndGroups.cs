using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hallen.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddGameAndGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "sports_group_id",
                table: "players",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "sports_groups",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sports_groups", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "game_sessions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    sports_group_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_game_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_game_sessions_sports_groups_sports_group_id",
                        column: x => x.sports_group_id,
                        principalTable: "sports_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "game_matches",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    match_number = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    finished_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    game_session_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_game_matches", x => x.id);
                    table.ForeignKey(
                        name: "FK_game_matches_game_sessions_game_session_id",
                        column: x => x.game_session_id,
                        principalTable: "game_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "game_teams",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    game_session_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_game_teams", x => x.id);
                    table.ForeignKey(
                        name: "FK_game_teams_game_sessions_game_session_id",
                        column: x => x.game_session_id,
                        principalTable: "game_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "game_match_team_results",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    score = table.Column<int>(type: "integer", nullable: false),
                    game_match_id = table.Column<Guid>(type: "uuid", nullable: false),
                    game_team_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_game_match_team_results", x => x.id);
                    table.ForeignKey(
                        name: "FK_game_match_team_results_game_matches_game_match_id",
                        column: x => x.game_match_id,
                        principalTable: "game_matches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_game_match_team_results_game_teams_game_team_id",
                        column: x => x.game_team_id,
                        principalTable: "game_teams",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "game_team_players",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    player_id = table.Column<Guid>(type: "uuid", nullable: false),
                    game_team_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_game_team_players", x => x.id);
                    table.ForeignKey(
                        name: "FK_game_team_players_game_teams_game_team_id",
                        column: x => x.game_team_id,
                        principalTable: "game_teams",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_game_team_players_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_players_sports_group_id",
                table: "players",
                column: "sports_group_id");

            migrationBuilder.CreateIndex(
                name: "IX_game_match_team_results_game_match_id_game_team_id",
                table: "game_match_team_results",
                columns: new[] { "game_match_id", "game_team_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_game_match_team_results_game_team_id",
                table: "game_match_team_results",
                column: "game_team_id");

            migrationBuilder.CreateIndex(
                name: "IX_game_matches_game_session_id_match_number",
                table: "game_matches",
                columns: new[] { "game_session_id", "match_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_game_sessions_sports_group_id",
                table: "game_sessions",
                column: "sports_group_id");

            migrationBuilder.CreateIndex(
                name: "IX_game_team_players_game_team_id_player_id",
                table: "game_team_players",
                columns: new[] { "game_team_id", "player_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_game_team_players_player_id",
                table: "game_team_players",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_game_teams_game_session_id",
                table: "game_teams",
                column: "game_session_id");

            migrationBuilder.AddForeignKey(
                name: "FK_players_sports_groups_sports_group_id",
                table: "players",
                column: "sports_group_id",
                principalTable: "sports_groups",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_players_sports_groups_sports_group_id",
                table: "players");

            migrationBuilder.DropTable(
                name: "game_match_team_results");

            migrationBuilder.DropTable(
                name: "game_team_players");

            migrationBuilder.DropTable(
                name: "game_matches");

            migrationBuilder.DropTable(
                name: "game_teams");

            migrationBuilder.DropTable(
                name: "game_sessions");

            migrationBuilder.DropTable(
                name: "sports_groups");

            migrationBuilder.DropIndex(
                name: "IX_players_sports_group_id",
                table: "players");

            migrationBuilder.DropColumn(
                name: "sports_group_id",
                table: "players");
        }
    }
}
