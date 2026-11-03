#!/usr/bin/env bash
# Restore only to an empty test database. Never drops or overwrites existing data.
set -euo pipefail
umask 077
: "${PGDATABASE:?Set PGDATABASE to an EMPTY TEST DATABASE}"
: "${BACKUP_IDENTITY_FILE:?Set the path to your private age key file}"
: "${HALLEN_RESTORE_CONFIRM:?Set HALLEN_RESTORE_CONFIRM=empty-test-database}"
if [[ "$HALLEN_RESTORE_CONFIRM" != "empty-test-database" || $# -ne 1 ]]; then
  printf 'Usage: HALLEN_RESTORE_CONFIRM=empty-test-database %s encrypted-backup.dump.age\n' "$0" >&2
  exit 1
fi
if [[ $(psql -X -Atqc "SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') AND schemaname NOT LIKE 'pg_toast%'") != "0" ]]; then
  printf 'Refusing to restore: target database contains tables.\n' >&2
  exit 1
fi
# A normal empty PostgreSQL database already has public. Exclude only its schema
# creation/comment entries, without dropping the schema or ignoring restore errors.
restore_toc=$(mktemp)
restore_filtered=$(mktemp)
trap 'rm -f -- "$restore_toc" "$restore_filtered"' EXIT
# Drain the stream after pg_restore reads the TOC, so age validates the entire
# ciphertext and large archives cannot fail with a broken pipe here.
age --decrypt --identity "$BACKUP_IDENTITY_FILE" "$1" | { pg_restore --list; cat >/dev/null; } > "$restore_toc"
if [[ $(psql -X -Atqc "SELECT EXISTS(SELECT FROM pg_namespace WHERE nspname='public')") == "t" ]]; then
  awk '!/ SCHEMA - public / && !/ COMMENT - SCHEMA public /' "$restore_toc" > "$restore_filtered"
else
  cp -- "$restore_toc" "$restore_filtered"
fi
age --decrypt --identity "$BACKUP_IDENTITY_FILE" "$1" | pg_restore --exit-on-error --single-transaction --no-owner --no-acl --use-list="$restore_filtered" --dbname="$PGDATABASE"
printf 'Restore finished in the empty test database. Verify login, groups, sessions and match history before relying on the backup.\n'
