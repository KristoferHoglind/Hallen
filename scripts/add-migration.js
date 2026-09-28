const { spawnSync } = require("node:child_process");

const migrationName = process.argv[2];

if (!migrationName) {
  console.error("Missing migration name.");
  console.error("Usage: npm run db:add -- MigrationName");
  process.exit(1);
}

const result = spawnSync(
  "dotnet",
  [
    "ef",
    "migrations",
    "add",
    migrationName,
    "--project",
    "backend/Hallen.Database",
    "--startup-project",
    "backend/Hallen.Api",
  ],
  {
    stdio: "inherit",
    shell: true,
  },
);

process.exit(result.status ?? 1);