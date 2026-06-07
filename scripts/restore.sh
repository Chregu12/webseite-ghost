#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Restore a backup created by scripts/backup.sh.
#
#   ./scripts/restore.sh backups/db-20260607-120000.sql.gz \
#                        backups/content-20260607-120000.tar.gz
#
# WARNING: overwrites the current database and content volume.
# ---------------------------------------------------------------------------
set -euo pipefail

DB_DUMP="${1:-}"
CONTENT_ARCHIVE="${2:-}"
if [[ -z "$DB_DUMP" || -z "$CONTENT_ARCHIVE" ]]; then
  echo "Usage: $0 <db-*.sql.gz> <content-*.tar.gz>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$REPO_DIR/docker"
DB_DUMP="$(cd "$(dirname "$DB_DUMP")" && pwd)/$(basename "$DB_DUMP")"
CONTENT_ARCHIVE="$(cd "$(dirname "$CONTENT_ARCHIVE")" && pwd)/$(basename "$CONTENT_ARCHIVE")"

set -a; . "$DOCKER_DIR/.env"; set +a
cd "$DOCKER_DIR"

read -r -p "This will OVERWRITE the database and content volume. Continue? [y/N] " ok
[[ "$ok" == "y" || "$ok" == "Y" ]] || { echo "Aborted."; exit 1; }

echo "[restore] stopping ghost …"
docker compose stop ghost

echo "[restore] database …"
gunzip -c "$DB_DUMP" | docker compose exec -T mysql sh -c \
  "exec mysql -uroot -p'$DB_ROOT_PASSWORD' '$DB_NAME'"

echo "[restore] content volume …"
docker compose run --rm --no-deps -T -v "$(dirname "$CONTENT_ARCHIVE"):/backup" ghost \
  sh -c "rm -rf /var/lib/ghost/content/* && tar xzf /backup/$(basename "$CONTENT_ARCHIVE") -C /var/lib/ghost/content" >/dev/null

echo "[restore] starting ghost …"
docker compose start ghost
echo "[restore] done."
