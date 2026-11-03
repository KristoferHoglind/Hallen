#!/usr/bin/env bash
# Uses libpq environment variables/PGSERVICE. No credentials in command arguments.
set -euo pipefail
umask 077
: "${PGDATABASE:?Set PGDATABASE for the source database}"
: "${BACKUP_RECIPIENT:?Set the age public recipient key}"
backup_dir="${BACKUP_DIRECTORY:-./backups}"
command -v pg_dump >/dev/null
command -v age >/dev/null
mkdir -p "$backup_dir"
backup_tmp=$(mktemp "$backup_dir/.hallen-backup.XXXXXX")
trap 'rm -f -- "$backup_tmp"' EXIT
backup_file="$backup_dir/hallen-$(date -u +%Y%m%dT%H%M%SZ)-${backup_tmp##*.}.dump.age"
pg_dump --format=custom --schema=public --no-owner --no-acl | age --recipient "$BACKUP_RECIPIENT" --output "$backup_tmp"
test -s "$backup_tmp"
mv -- "$backup_tmp" "$backup_file"
printf 'Encrypted backup created: %s\n' "$backup_file"
