#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Backup the Ghost stack: MySQL database + the Ghost content volume
# (images, themes, settings). Run from anywhere; paths are resolved relative
# to this script. Keeps the most recent $KEEP backups (rotating).
#
#   ./scripts/backup.sh            # writes to ./backups/
#   BACKUP_DIR=/mnt/backups ./scripts/backup.sh
#
# Restore with scripts/restore.sh.
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$REPO_DIR/docker"
BACKUP_DIR="${BACKUP_DIR:-$REPO_DIR/backups}"
KEEP="${KEEP:-7}"
TS="$(date +%Y%m%d-%H%M%S)"

# Load DB credentials from docker/.env
set -a; . "$DOCKER_DIR/.env"; set +a

mkdir -p "$BACKUP_DIR"
cd "$DOCKER_DIR"

echo "[backup] MySQL database '$DB_NAME' …"
docker compose exec -T mysql sh -c \
  "exec mysqldump --single-transaction --routines --triggers -uroot -p'$DB_ROOT_PASSWORD' '$DB_NAME'" \
  | gzip > "$BACKUP_DIR/db-$TS.sql.gz"

echo "[backup] Ghost content volume …"
docker compose run --rm --no-deps -T \
  -v "$BACKUP_DIR:/backup" ghost \
  tar czf "/backup/content-$TS.tar.gz" -C /var/lib/ghost/content . >/dev/null

echo "[backup] rotating (keeping $KEEP) …"
# db-*.sql.gz and content-*.tar.gz each have exactly one extension, so rotate
# each set independently. nullglob makes a non-matching glob expand to nothing
# instead of a literal pattern that would make `ls`/the pipeline fail under
# `set -euo pipefail` (which previously aborted before content was rotated).
# Timestamps are lexically sortable, so a plain reverse sort = newest first.
shopt -s nullglob
for spec in "db:sql.gz" "content:tar.gz"; do
  prefix="${spec%%:*}"; ext="${spec#*:}"
  files=("$BACKUP_DIR/$prefix-"*."$ext")
  ((${#files[@]} > KEEP)) || continue
  printf '%s\n' "${files[@]}" | sort -r | tail -n +"$((KEEP + 1))" | xargs -r rm -f
done
shopt -u nullglob

echo "[backup] done -> $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | grep "$TS" || true
