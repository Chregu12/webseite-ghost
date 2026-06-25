# Deployment (Produktion)

Self-hosted Stack: **Ghost 6 + MySQL 8 + Next.js-Frontend + Caddy** (Auto-TLS) in einem
`docker compose`. Caddy routet zwei Domains:

| Domain | Service |
|---|---|
| `SITE_DOMAIN` (z. B. `example.com`) | Next.js (öffentliche Webseite) |
| `CMS_DOMAIN` (z. B. `cms.example.com`) | Ghost (Admin + APIs) |

## Voraussetzungen

- Server mit Docker + Docker Compose (Ubuntu 24, Node-/MySQL-Images via Compose).
- **DNS:** je ein A/AAAA-Record für `SITE_DOMAIN` **und** `CMS_DOMAIN` auf die Server-IP.
- Offene Ports **80/443**.
- SMTP-Zugang (für Member-/Newsletter-Magic-Links).

## 1. Konfiguration

```bash
cd docker
cp .env.example .env
```

In `.env` setzen:
- `SITE_DOMAIN`, `CMS_DOMAIN`
- `GHOST_URL=https://<CMS_DOMAIN>`
- starke `DB_*`-Passwörter
- `REVALIDATE_SECRET` (z. B. `openssl rand -hex 16`)
- `MAIL_*` (SMTP)

> `GHOST_CONTENT_API_KEY` / `GHOST_ADMIN_API_KEY` bleiben zunächst leer – sie entstehen erst
> nach dem ersten Ghost-Start (Schritt 3).

## 2. Erststart (Ghost + DB + Proxy)

```bash
docker compose --profile web up -d --build
```

Das baut auch das Frontend-Image (`frontend/Dockerfile`, multi-stage, `next build`,
`output: standalone`). Caddy holt automatisch Let's-Encrypt-Zertifikate für beide Domains.

## 3. Ghost einrichten & API-Keys

1. `https://<CMS_DOMAIN>/ghost` öffnen → Owner-Account anlegen, Titel/Logo/Icon/Akzentfarbe setzen.
2. **Einstellungen → Integrationen → Custom Integration** anlegen → **Content API Key** und
   **Admin API Key** kopieren.
3. In `docker/.env` eintragen: `GHOST_CONTENT_API_KEY=…`, `GHOST_ADMIN_API_KEY=…`
4. Frontend neu starten, damit es die Keys bekommt:
   ```bash
   docker compose up -d frontend
   ```

## 4. Webhook für sofortige Updates

In Ghost (Integrations → der Integration einen Webhook hinzufügen) **für jedes relevante Event**
(`post.published`, `post.unpublished`, `post.edited`, `page.*`, `tag.*`, `settings.changed`):

- **Target URL:** `https://<SITE_DOMAIN>/api/revalidate?secret=<REVALIDATE_SECRET>`

Damit aktualisiert sich die Seite ohne Vollrebuild (On-demand-ISR).

## 5. Inhalte

Siehe **[REDAKTION.md](./REDAKTION.md)**. Optional Demo-Inhalte:

```bash
GHOST_URL=https://<CMS_DOMAIN> GHOST_ADMIN_API_KEY=<id>:<secret> node scripts/seed.mjs
```

## 6. Backups (Cron)

`scripts/backup.sh` sichert DB-Dump + Content-Volume (rotierend, Default 7 Stände).

```bash
# z. B. täglich um 3 Uhr
0 3 * * * cd /pfad/zu/webseite-ghost && ./scripts/backup.sh >> /var/log/ghost-backup.log 2>&1
```

Wiederherstellen:

```bash
./scripts/restore.sh backups/db-<TS>.sql.gz backups/content-<TS>.tar.gz
```

## 7. Updates

```bash
cd docker
docker compose pull            # neue Ghost/MySQL-Images
docker compose --profile web up -d --build   # Frontend neu bauen + alles aktualisieren
```

## Hinweise

- **Frontend-Image-Build** benötigt während `docker build` Internet-Zugriff aus dem Build-Container
  (npm-Registry + Schriftarten). Auf einem normalen Docker-Host ist das gegeben.
- Die **DB ist nicht öffentlich** exponiert (nur im internen Compose-Netz). Ghost ist nur über
  Caddy/TLS erreichbar; in Produktion sollte das direkte Port-Mapping `2368` entfernt werden,
  wenn nur Caddy davorstehen soll.
- Ghost-Admin mit starkem Passwort + 2FA absichern.
