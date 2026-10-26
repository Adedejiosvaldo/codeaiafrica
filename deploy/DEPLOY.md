# Deploying Akada Labs on a VPS

This puts the whole platform on one server (4 GB RAM / 4 vCPU is plenty for a 40-person cohort):

```
Internet ──▶ Caddy (HTTPS, ports 80/443) ──▶ Akada app (site, API, browser lab) ──▶ RAG chunker
                                                    │
                                                    └──▶ AI provider (Groq/Gemini), with your key
```

Only Caddy is reachable from the internet. The chunker and the app talk on a private Docker network.

## 1. Prepare the server (once)

Any recent Ubuntu or Debian works. Pick a data centre close to Nigeria (London, Frankfurt, Amsterdam,
or Lagos/Johannesburg if your provider has them).

```bash
# Log in as root the first time, then:
adduser akada && usermod -aG sudo akada
# Copy your SSH key to the new user, then turn off password logins:
#   in /etc/ssh/sshd_config set PasswordAuthentication no, then: systemctl restart ssh

# Firewall: SSH and the web only
ufw allow OpenSSH && ufw allow 80,443/tcp && ufw allow 443/udp && ufw enable

# Automatic security updates
apt update && apt install -y unattended-upgrades && dpkg-reconfigure -plow unattended-upgrades

# Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker akada
```

## 2. Point your domain at the server

In your DNS provider, add two records pointing at the server's IP address:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` (akadalabs.org) | your server IP |
| A | `www` | your server IP |

Wait until `ping akadalabs.org` shows the right IP (minutes to a few hours).

## 3. Install the app

```bash
sudo mkdir -p /opt/akada && sudo chown akada /opt/akada
git clone https://github.com/Adedejiosvaldo/codeaiafrica.git /opt/akada
cd /opt/akada
cp .env.example .env
nano .env        # fill in DOMAIN, SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, AI_API_KEY, ...
docker compose up -d --build
```

The first build takes a few minutes. Then open `https://your-domain`. Caddy fetches the HTTPS
certificate on the first visit. Sign in at `/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and change
the password under Settings.

Check everything is healthy:

```bash
docker compose ps                         # all three should be "running" / "healthy"
curl https://your-domain/api/health       # {"ok": true, "database": "ok", "chunker": "ok"}
```

## 4. Backups

The database is a single SQLite file inside the `app_data` volume. Back it up nightly:

```bash
crontab -e
# add this line:
15 2 * * * /opt/akada/deploy/backup.sh >> /var/log/akada-backup.log 2>&1
```

That keeps 14 days of backups in `/opt/akada/backups`. **Also copy them off the server**, or a lost
server means lost data. The simplest way is [rclone](https://rclone.org) to any cloud storage
(Google Drive, Backblaze B2, S3...):

```bash
sudo apt install -y rclone
rclone config                       # create a remote, e.g. named "offsite"
# then add RCLONE_REMOTE=offsite:akada-backups before the cron command:
15 2 * * * RCLONE_REMOTE=offsite:akada-backups /opt/akada/deploy/backup.sh >> /var/log/akada-backup.log 2>&1
```

### Restoring a backup

```bash
cd /opt/akada
gunzip -k backups/akada-YYYYMMDD-HHMMSS.db.gz
docker compose stop app
docker compose cp backups/akada-YYYYMMDD-HHMMSS.db app:/data/akada.db
docker compose start app
```

## 5. Updating

```bash
cd /opt/akada
./deploy/backup.sh            # always back up first
git pull
docker compose up -d --build  # database migrations run automatically on start
```

## 6. Keeping an eye on it

- **Uptime:** point a free monitor (UptimeRobot, Better Stack) at `https://your-domain/api/health`.
  It returns an error if the database is down, and `"chunker": "unreachable"` if the chunker is.
- **Errors:** set `SENTRY_DSN` in `.env` to get an email when the app hits an error (free Sentry plan).
- **Logs:** `docker compose logs -f app` (or `caddy`, `chunker`).
- **AI usage:** the team dashboard's **AI usage** page shows calls per day and per learner, against the
  limits in `.env`.

## Settings reference

All settings live in `.env`; see `.env.example` for every option with comments. After changing `.env`,
run `docker compose up -d` to apply it.

| Setting | What it does |
| --- | --- |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODELS` | The AI provider for labs 7-10. Any OpenAI-compatible API works. |
| `AI_DAILY_LIMIT` | AI calls each learner can make per day (resets at midnight Lagos time). |
| `AI_DAILY_BUDGET` | All AI calls per day, across everyone. A hard stop on cost. |
| `EMBED_*` | Embeddings for weeks 8-9 (Groq doesn't offer them; Gemini does). |
| `SMTP_*` | Email for learner links, application updates and the waitlist. |

## The chunker

`docker-compose.yml` builds the chunker straight from
[github.com/Adedejiosvaldo/rag-chunker](https://github.com/Adedejiosvaldo/rag-chunker). Once you tag a
release there, change `#main` to the tag (e.g. `#v1.0.0`) so its behaviour can't change mid-cohort.
