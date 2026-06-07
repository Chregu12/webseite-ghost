# Upgrade- & Update-Sicherheit

Ziel: Ghost (und MySQL/Node/Next) **gefahrlos aktualisieren**, ohne dass die Webseite bricht.

## Warum das hier robust ist

- **Headless = kein Theme-/Plugin-Bruch.** Anders als bei WordPress hängt das Frontend nicht an
  einem Ghost-Theme. Ghost-Updates können kein Layout zerschießen.
- **Resilientes Frontend.** Der API-Client gibt bei Fehlern `null`/`[]` zurück und nutzt Fallbacks;
  bei Ghost-Ausfall liefert Next.js den letzten ISR-Stand weiter aus.
- **Ein API-Vertrag, ein Schalter.** Die Ghost-API-Version ist zentral über `GHOST_API_VERSION`
  gepinnt (Default `v6.0`). Ein Major-Wechsel = eine bewusste Änderung.
- **Automatischer Vertrags-Test.** `scripts/healthcheck.mjs` prüft nach jedem Upgrade alle
  Invarianten, auf die sich der Code verlässt (API-Felder, Pagination-Limit, site-config-JSON,
  Rendering, SEO/AEO-Endpunkte, Sicherheits-404). Bricht etwas, schlägt es **laut** fehl.
- **CI als Upgrade-Gate.** `.github/workflows/ci.yml` fährt den ganzen Stack hoch und führt den
  Healthcheck aus — ein PR, der die Ghost-Version anhebt, wird automatisch getestet.

## Versions-Pinning-Strategie

| Komponente | Pin | Anmerkung |
|---|---|---|
| Ghost | `ghost:6-alpine` | folgt 6.x (Sicherheits-Patches); Major bewusst anheben |
| MySQL | `mysql:8.4` | Major (9) nur geplant + Backup |
| Ghost API | `GHOST_API_VERSION=v6.0` | bei Ghost-Major mitziehen (v7.0 …) |
| Node | `node:22` (Frontend/MCP) | LTS |

## Minor-/Patch-Update (z. B. Ghost 6.x → 6.y)

```bash
cd docker
../scripts/backup.sh                     # 1. Backup (DB + content)
docker compose pull                      # 2. neue 6.x/8.4 Images
docker compose --profile web up -d       # 3. Ghost migriert die DB automatisch beim Start
# 4. warten bis Ghost antwortet, dann Vertrag prüfen:
SITE_URL=https://<SITE_DOMAIN> \
GHOST_URL=https://<CMS_DOMAIN> \
GHOST_CONTENT_API_KEY=<key> \
node ../scripts/healthcheck.mjs
```

- **Healthcheck grün** → Upgrade fertig.
- **Healthcheck rot** → siehe Rollback.

## Major-Upgrade (z. B. Ghost 6 → 7)

1. **Changelog lesen** (Breaking Changes der API) — https://docs.ghost.org/changes
2. **Backup** (`scripts/backup.sh`).
3. Image-Tag in `docker/docker-compose.yml` auf `ghost:7-alpine` setzen.
4. `GHOST_API_VERSION=v7.0` in `docker/.env` setzen (Frontend nutzt es automatisch).
5. `docker compose --profile web up -d --build` (Ghost migriert die DB; Frontend neu gebaut).
6. **Healthcheck** ausführen.
7. Falls der Healthcheck einen geänderten Vertrag meldet (z. B. ein entferntes Feld), genau dort
   nachziehen — i. d. R. nur in:
   - `frontend/lib/ghost/content.ts` (Filter/Felder/Pagination)
   - `frontend/lib/ghost/types.ts` / `lib/ghost/meta.ts` (Feldnamen)
   - `frontend/lib/ghost/config.ts` (site-config-Schema)
   Healthcheck erneut grün → fertig.

> Tipp: Major-Upgrade zuerst lokal/Staging mit `docker compose up -d` + Healthcheck testen,
> nicht direkt in Produktion.

## MySQL-Upgrade

MySQL-Daten liegen im Volume `mysql_data`. Innerhalb von 8.x unkritisch (Backup genügt). Vor 8→9:
Backup, dann neues Image, Start (MySQL migriert das Datenverzeichnis), Healthcheck.

## Frontend- / MCP- / Dependency-Updates

```bash
cd frontend && npm update && npm run typecheck && npm run build   # lokal prüfen
cd ../mcp && npm update && npm run build
```
CI (`build`-Job) prüft Typecheck + Build bei jedem Push/PR.

## Rollback

```bash
cd docker
docker compose stop ghost
# vorherigen Image-Tag in docker-compose.yml zurücksetzen, dann:
../scripts/restore.sh ../backups/db-<TS>.sql.gz ../backups/content-<TS>.tar.gz
docker compose --profile web up -d
node ../scripts/healthcheck.mjs
```

## Regelmäßig (auch ohne Upgrade)

- **Webhooks** decken nicht alles ab → der Healthcheck eignet sich auch als periodischer
  Cron-Smoke-Test (z. B. stündlich), um stilles Driften früh zu erkennen.
