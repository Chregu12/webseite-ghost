# webseite-ghost

Persönliche Webseite & Blog im **Antigravity-Look**, gebaut als **Headless-Setup**:

- **Ghost 6** (self-hosted, Docker) = CMS, Admin-Panel & APIs – die codefreie Redaktion.
- **Next.js** (App Router, TypeScript) = selbst gebautes Frontend auf den Ghost-APIs.
- Zweisprachig **DE/EN**, dunkles Design, **Ghost-native cookielose Analytics**.

Vollständige Spezifikation: **[ANFORDERUNGEN.md](./ANFORDERUNGEN.md)**.

---

## Projektstruktur

```
webseite-ghost/
├─ ANFORDERUNGEN.md     # End-to-End-Anforderungen (Quelle der Wahrheit)
├─ docker/              # docker-compose (Ghost 6 + MySQL + Caddy), .env.example, Caddyfile
├─ frontend/            # Next.js App (App Router, TS)
└─ docs/                # Redaktions-Guide
```

## Schnellstart (lokale Entwicklung)

### 1. Ghost + MySQL starten

```bash
cd docker
cp .env.example .env          # Werte anpassen (DB-Passwörter etc.)
docker compose up -d          # startet mysql + ghost
```

- Ghost-Admin: <http://localhost:2368/ghost> → ersten Account anlegen.
- In **Einstellungen → Integrationen** eine *Custom Integration* erstellen und den
  **Content API Key** (und für Skripte den **Admin API Key**) kopieren.

### 2. Frontend starten

```bash
cd ../frontend
npm install
# Keys aus Ghost eintragen:
echo "GHOST_URL=http://localhost:2368"     >  .env.local
echo "GHOST_CONTENT_API_KEY=<dein-key>"    >> .env.local
echo "REVALIDATE_SECRET=$(openssl rand -hex 16)" >> .env.local
npm run dev
```

- Webseite: <http://localhost:3000> → leitet auf `/de` bzw. `/en` weiter.
- Das Frontend rendert auch **ohne Inhalte/Keys** (Fallbacks), du siehst dann das Grundgerüst.

### 3. Inhalte pflegen (codefrei)

Siehe **[docs/REDAKTION.md](./docs/REDAKTION.md)** – u. a. die `site-config`-Seite (JSON)
für Hero-Texte & Sektions-Schalter sowie die Tag-Konventionen (`#feature`, `#de`/`#en`).

Optional: schnell Demo-Inhalte erzeugen (idempotent, Admin-API-Key nötig):

```bash
GHOST_URL=http://localhost:2368 GHOST_ADMIN_API_KEY=<id>:<secret> node scripts/seed.mjs
```

## Produktion

```bash
cd docker
# SITE_DOMAIN / CMS_DOMAIN + GHOST_URL=https://cms.example.com in .env setzen
docker compose --profile web up -d --build   # ghost + mysql + frontend + caddy (TLS)
```

Danach in Ghost einen **Webhook** auf `https://<SITE_DOMAIN>/api/revalidate?secret=<REVALIDATE_SECRET>`
einrichten (Events: `post.*`, `page.*`, `tag.*`, `settings.changed`).

## Status

Umgesetzt: **M1** (Docker-Setup) · **M2** (Next.js-Grundgerüst + Content-API-Client, i18n,
Blog, Revalidate-Webhook) · **M3** (alle modularen Startseiten-Sektionen aus getaggten
Inhalten: Logos, Features, Showcase, Testimonials, neueste Beiträge + Newsletter via Ghost
Members, je per `site-config` schaltbar) · **M4/SEO** (Tag-Archive, RSS pro Sprache,
`sitemap.xml`, `robots.txt`, JSON-LD für Article & WebSite, hreflang/RSS-Alternates) ·
**M7** (clientseitige Suche aus dem Content-Index, content-driven Kontaktseite).
Als Nächstes: finaler Politur-/Performance-Durchlauf (M8) und End-to-End-Test mit echtem
Ghost-Container. Siehe Roadmap in
[ANFORDERUNGEN.md](./ANFORDERUNGEN.md#16-roadmap--meilensteine).
