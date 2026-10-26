#!/bin/sh
# Nightly backup: a safe copy of the database, kept for 14 days on the server.
# Add to the server's crontab (crontab -e):
#   15 2 * * * /opt/akada/deploy/backup.sh >> /var/log/akada-backup.log 2>&1
# Then copy /opt/akada/backups somewhere off the server, e.g. with rclone (see DEPLOY.md).
set -eu
cd "$(dirname "$0")/.."
docker compose exec -T app python -m app.cli backup /data/backups --keep 14
mkdir -p backups
docker compose cp app:/data/backups/. backups/
if [ -n "${RCLONE_REMOTE:-}" ]; then
  rclone copy backups "$RCLONE_REMOTE" --max-age 2d
fi
echo "$(date -Iseconds) backup done"
