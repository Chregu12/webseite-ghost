# Anforderungen: Persönliche Webseite & Blog – Headless Ghost 6 + Next.js (Antigravity-Look)

> **Status:** Entwurf v2 (Headless) · **Datum:** 2026-06-07 · **Branch:** `claude/ghost-website-editable-backend-eOKji`
> **Architektur-Entscheidung:** Ghost 6 läuft **headless** als CMS & Admin-Panel. Das **Frontend bauen wir selbst** mit **Next.js** und nutzen **alle Ghost-APIs** (Content API, Admin API, Webhooks, Members). Ghost ist die „WordPress-artige", codefreie Redaktionsoberfläche; das Rendering/Design liegt vollständig bei uns.

---

## 1. Vision & Ziel

Eine **persönliche Webseite mit Blog** im Stil von [antigravity.google](https://antigravity.google/)
(dunkel, modern, „agentic-tech"), bei der **alle Inhalte über das Ghost-6-Admin gepflegt** werden –
**ohne Code anzufassen** (Anspruch „wie WordPress") – während das Frontend ein eigenes, frei
gestaltetes Next.js-Projekt ist.

### Leitprinzipien
1. **Headless:** Ghost 6 = Quelle der Wahrheit + Redaktion. Next.js = Präsentation.
2. **Content-driven & codefrei pflegbar:** Hero-Texte, Sektionen, Karten, Navigation, Farben,
   Blogposts – alles im Ghost-Admin editierbar. Konventionen (siehe §6) statt Hardcoding.
3. **Alle Ghost-APIs nutzen:** Content API (lesen), Admin API (Build/Automation), Webhooks
   (gezieltes Neu-Generieren), Members (Newsletter/Gated Content).
4. **Zweisprachig (DE + EN):** Next.js-i18n-Routing `/de` `/en`, gepaart mit Ghost-Tag-Collections.
5. **Self-hosted:** Ghost + MySQL + Next.js + Reverse-Proxy in **einem Docker-Compose**.
6. **Hybrid-Rendering:** SSG/ISR für Inhalte, Client/dynamisch für Members, Newsletter, Suche.

### Nicht-Ziele (v1)
- Kein Shop/E-Commerce. Kein 1:1-Antigravity-Klon (nur Stil/Struktur). Kein WYSIWYG-Pagebuilder
  mit freiem Drag&Drop der Sektionen (Ghost-untypisch; v1 nutzt Konventionen + Toggles).

---

## 2. Referenz-Design (Antigravity-Look)

| Merkmal | Übernahme |
|---|---|
| Grundton | Sehr dunkel (fast schwarz), hoher Kontrast; Light-Mode optional |
| Akzent | 1–2 Akzentfarben + Verlauf (Blau/Violett/Cyan), aus Ghost editierbar (`accent_color`) |
| Typografie | Große, fette Sans-Headlines; klare Body-Schrift (Inter/Geist/„Google-Sans-like") |
| Hero | Riesige Headline, kurzer Subtext, 2 prominente CTAs, animiertes/3D-Visual |
| Sektionen | Feature-Karten, Split-Showcases, Logo-Leiste, CTA-Band – modular |
| Cards | Abgerundet, feine Border, dezenter Glow/Glas-Effekt |
| Motion | Subtile Scroll-/Hover-Effekte; aus bei `prefers-reduced-motion` |

Stilquellen: [Google Developers Blog – Antigravity](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/) · [antigravity.google](https://antigravity.google/)

---

## 3. Architektur (Headless)

```
                          ┌───────────────────────────────────────────────┐
        Besucher ───────► │  Reverse Proxy (Caddy) + TLS (Let's Encrypt)   │
   example.com            └───┬───────────────────────────────┬───────────┘
                              │ (Website)                     │ (CMS/API/Admin)
                  ┌───────────▼───────────┐        ┌──────────▼──────────────┐
                  │  Next.js (Node, Docker)│        │  Ghost 6 (Node, Docker) │
                  │  - App Router, i18n    │        │  - Admin-Panel (Redaktion)
                  │  - SSG/ISR + Client    │◄──────►│  - Content API (read)    │
                  │  - /api/revalidate     │  HTTPS │  - Admin API (write)     │
                  │  - Members/Newsletter  │  API   │  - Members API           │
                  └───────────┬───────────┘        │  - Webhooks ─────────────┼─┐
                              │                     └──────────┬──────────────┘ │
                              │                                │                │ webhook
                              │                     ┌──────────▼──────────┐     │ on publish
                              │                     │   MySQL 8 (Docker)  │     │
                              │                     └─────────────────────┘     │
                              └◄──────────── POST /api/revalidate ──────────────┘
```

- **CMS/Daten/Redaktion:** Ghost 6, self-hosted (Docker). Erreichbar unter eigener Domain
  (z. B. `cms.example.com`) für Admin + APIs.
- **Frontend:** Next.js (App Router) unter der Hauptdomain (`example.com`), eigener Container.
- **DB:** MySQL 8 (Ghost-Standard in v6), eigener Container, persistentes Volume.
- **Proxy/TLS:** Caddy (automatisches Let's-Encrypt-TLS) routet `example.com` → Next.js und
  `cms.example.com` → Ghost.
- **Daten-Fluss:**
  - **Build/Render:** Next.js liest Inhalte server-side über die **Content API** (gecached).
  - **Aktualität:** Ghost-**Webhooks** rufen `POST /api/revalidate` in Next.js → gezieltes
    On-demand-Revalidate (ISR) der betroffenen Pfade/Tags.
  - **Automation/Seed:** **Admin API** (JWT) für Skripte (z. B. Demo-Inhalte anlegen, Bilder-Upload).
  - **Members:** Newsletter-Anmeldung & ggf. Gated Content über Ghost **Members**.

### Domains/Umgebung
| Zweck | Domain (Beispiel) | Service |
|---|---|---|
| Webseite (öffentlich) | `example.com` | Next.js |
| Ghost-Admin & APIs | `cms.example.com` | Ghost 6 |

---

## 4. Ghost-6-APIs – konkrete Nutzung

### 4.1 Content API (read-only, public)
- **Auth:** Content-API-Key (Query-Param), serverseitig in Next.js verwendet.
- **Ressourcen:** `posts`, `pages`, `authors`, `tags`, `tiers`, `settings`, `site`.
- **Parameter:** `filter` (z. B. `tag:hash-feature+visibility:public`), `include` (`tags,authors`),
  `fields`, `order`, `page`, `limit`.
- **⚠ Ghost 6 Breaking Change:** **kein `limit=all`**, **max. 100 Items/Seite** → wir
  **paginieren** generisch in einem API-Client (`fetchAllPaginated`).
- **Inhaltsformat:** HTML (`formats=html`) für Render; optional `lexical` falls wir selbst rendern.
- **Caching:** voll cachebar, keine Rate-Limits → mit `revalidateTag`/`fetch`-Cache kombinieren.

### 4.2 Admin API (CRUD, server-side)
- **Auth:** JWT aus Admin-API-Key (kurzlebig, max. 5 Min) **oder** Staff-Token.
- **Nutzung bei uns:** Seed-/Migrations-Skripte, Bild-Upload, Anlegen von Demo-Sektionen,
  ggf. Programmatic Publishing. **Niemals** im Browser/Client – nur in serverseitigen Skripten/Routes.
- **Quellformat:** **Lexical** (Standard in v6) bzw. HTML.

### 4.3 Webhooks → On-demand-Revalidation
- In Ghost-Admin (Integration) Webhooks für `post.published`, `post.unpublished`, `post.edited`,
  `page.*`, `tag.*`, `settings.changed` → Ziel `https://example.com/api/revalidate`.
- Next.js-Route validiert ein **Shared Secret**, mappt Event → Pfad/Tag und ruft
  `revalidatePath`/`revalidateTag`. So bleibt SSG aktuell ohne Vollrebuild.

### 4.4 Members API (Hybrid/Client)
- Newsletter-Anmeldung (Magic-Link) & optional Gated Content über Ghost Members.
- Frontend nutzt den Members-Endpoint/`@tryghost/members-api`-Flow (Client-Komponente).
- v1: mindestens Newsletter-Signup; Gated Content optional.

### 4.5 Grenze: keine echten Custom-Fields
Ghost hat **keine** beliebigen Custom-Fields. Strukturierte, editierbare Sektionen lösen wir über
**Konventionen** aus vorhandenen Feldern + interne Tags (siehe §6). Da wir das Frontend selbst
bauen, definieren wir dieses Mapping frei und stabil.

---

## 5. Mehrsprachigkeit (DE + EN)

- **Routing:** Next.js i18n unter `/de/...` und `/en/...` (Default-Redirect je nach
  `Accept-Language`), mit `next-intl` (o. ä.) für **UI-Strings** (`messages/de.json`, `en.json`).
- **Inhalte:** zweifach in Ghost gepflegt, getrennt über interne Tags `#de` / `#en`.
  Content-API-Filter z. B. `tag:hash-de`.
- **Paarung** der Sprachversionen via Slug-Konvention (`mein-post` ↔ `my-post`) oder gemeinsames
  „link"-Tag; Sprachumschalter verlinkt auf das Pendant.
- **SEO:** `<html lang>` korrekt, `hreflang`-Alternates DE/EN, sprachspezifische Sitemaps.
- **Aufwand/Grenze:** Inhalte doppelt pflegen; Paarung per Konvention (bewusst akzeptiert).
- **Alternative (nicht empfohlen):** Übersetzungs-Overlay (Weglot) – schneller, aber extern/kostenpflichtig.

---

## 6. Content-Modell & Editierbarkeit „wie WordPress" (codefrei)

Damit **jede** sichtbare Stelle im Ghost-Admin pflegbar ist, definieren wir ein klares Mapping
zwischen Ghost-Inhalten und Next.js-Sektionen:

| Editierbar im Admin | Ghost-Mechanismus | Im Frontend gelesen über |
|---|---|---|
| Seitentitel, Beschreibung, **Akzentfarbe**, Logo, Icon, Cover, **Navigation** (primär/sekundär) | Ghost **Settings** (Design/General/Navigation) | Content API `settings` |
| **Globale Texte & Toggles** (Hero-Headline/Subtext, CTA-Labels+Links, Sektion an/aus, Footer-Text) | **Entschieden:** Eine **Config-Page** mit **JSON** in einer Code-Card (Slug `site-config`), **zod-validiert** | Content API `pages/slug/site-config` → JSON parsen |
| **Sektions-Überschrift/Intro** (z. B. „Features") | **Tag**-Felder (`name`, `description`, `feature_image`) | Content API `tags` |
| **Wiederholbare Karten** (Features, Logos, Testimonials, Projekte) | **Posts/Pages mit internem Tag** (`#feature`, `#logo`, `#testimonial`, `#project`) + Felder `title`, `excerpt`/`custom_excerpt`, `feature_image`, `published` | Content API `posts?filter=tag:hash-feature` |
| **Blogposts** | normale **Posts** (Koenig-Editor, Tags `#de`/`#en`) | Content API `posts` |
| **Freie Seiten** (Über mich, Impressum, Datenschutz) | **Pages** (Koenig-Editor) | Content API `pages` |
| **Per-Element-HTML/Embed** | Koenig **HTML-Card** / `codeinjection` | im HTML enthalten |

> **Ergebnis:** Redaktion legt z. B. eine Feature-Karte an, indem sie einen Beitrag mit Tag
> `#feature`, Titel, Auszug und Feature-Bild speichert → Karte erscheint automatisch. Hero-Text
> ändern = Config-Page editieren. **Kein Code nötig.**

### Config-Page-Schema (Beispiel, JSON in Code-Card)
```json
{
  "hero": {
    "eyebrow": "Persönlicher Blog",
    "headline": "Ich baue Dinge mit Code & KI",
    "subtitle": "Gedanken, Projekte und Experimente.",
    "ctaPrimary": { "label": "Blog lesen", "url": "/de/blog" },
    "ctaSecondary": { "label": "Über mich", "url": "/de/about" },
    "visual": "https://cms.example.com/content/images/hero.png"
  },
  "sections": { "logos": true, "features": true, "showcase": true,
                "testimonials": false, "newsletter": true },
  "footer": { "text": "© 2026 …", "social": { "github": "…", "mastodon": "…" } }
}
```
(Pro Sprache eine Config-Page: `site-config` / `site-config-en`.)

---

## 7. Sitemap

```
/                         → Redirect auf /de oder /en (Accept-Language)
/de , /en                 Startseite (modulare Sektionen, §8)
/de/about , /en/about     Über mich (Ghost Page)
/de/blog , /en/blog       Blog-Übersicht (Posts, paginiert)
/de/blog/<slug>           Einzelner Post
/de/projects              (optional) Projekte (#project)
/de/tags/<slug>           Tag-Archiv
/de/contact               Kontakt
/sitemap.xml , /robots.txt , /rss.xml
404 / error
```

---

## 8. Startseiten-Sektionen (modular, je editierbar)

Jede Sektion ist über die Config-Page **ein-/ausblendbar**; Inhalte aus den in §6 genannten Quellen.

| # | Sektion | Quelle |
|---|---|---|
| 1 | **Hero** (Headline, Subtext, 2 CTAs, Visual, Eyebrow) | Config-Page `hero` |
| 2 | **Logo-/Skills-Leiste** | Posts `#logo` |
| 3 | **Feature-Highlights** (Karten) | Posts `#feature` + Tag-Header |
| 4 | **Split-Showcase** (Text/Visual alternierend) | Posts `#showcase` |
| 5 | **Neueste Blogposts** (letzte N) | Posts-Collection |
| 6 | **Testimonial/Zitat** | Posts `#testimonial` |
| 7 | **CTA-Band** | Config-Page |
| 8 | **Newsletter** | Ghost Members |

Globale Bausteine: **Header** (Logo, Navigation aus Settings, Sprachswitcher, Theme-Toggle, CTA),
**Footer** (Navigation, Social, Rechtliches).

---

## 9. Frontend-Architektur (Next.js)

```
frontend/
├─ app/
│  ├─ [lang]/                     # i18n-Segment (de|en)
│  │  ├─ layout.tsx               # Header/Footer, <html lang>, Theme
│  │  ├─ page.tsx                 # Startseite (Sektionen aus §8)
│  │  ├─ about/page.tsx
│  │  ├─ blog/page.tsx            # Liste (ISR)
│  │  ├─ blog/[slug]/page.tsx     # Post (SSG/ISR, generateStaticParams)
│  │  ├─ tags/[slug]/page.tsx
│  │  └─ contact/page.tsx
│  ├─ api/
│  │  ├─ revalidate/route.ts      # Ghost-Webhook → revalidateTag/Path (Secret)
│  │  └─ newsletter/route.ts      # Members-Signup-Proxy (optional)
│  ├─ sitemap.ts , robots.ts , rss
│  └─ globals.css                 # Design-Tokens (§10)
├─ lib/ghost/
│  ├─ content.ts                  # Content-API-Client + fetchAllPaginated
│  ├─ admin.ts                    # Admin-API (nur server/Skripte)
│  ├─ config.ts                   # Config-Page laden & validieren (zod)
│  └─ types.ts
├─ components/
│  ├─ sections/                   # Hero, Logos, Features, Showcase, CTA, Newsletter …
│  ├─ ui/                         # Button, Card, Badge, Nav, Footer, LangSwitcher, ThemeToggle
│  └─ blog/                       # PostCard, PostBody (Ghost-HTML rendern)
├─ messages/ de.json , en.json    # UI-Strings (next-intl)
├─ middleware.ts                  # Locale-Redirect
└─ next.config.ts
```

- **Rendering (Hybrid):**
  - **SSG/ISR** für Startseite, Blogliste/-posts, Pages, Tag-Archive (`fetch`-Cache + Tags,
    On-demand-Revalidate via Webhook).
  - **Client/dynamisch** für Newsletter-Signup, Members-Status, **Suche**.
- **Ghost-HTML rendern:** Post-/Page-`html` sicher einbetten; Ghost-spezifische Klassen
  (`kg-*`) im CSS abbilden (Cards, Galerien, Buttons, Callouts).
- **Bilder:** `next/image` mit erlaubtem Remote-Host (`cms.example.com`), responsive `srcset`.
- **Suche:** Index aus Content API bauen (Build-Time JSON) + clientseitig (Fuse.js/Pagefind).
- **Typsicherheit:** TypeScript + `zod`-Validierung der Config-Page & API-Responses.

---

## 10. Design-System / Tokens (CSS Custom Properties)

| Token | Vorschlag |
|---|---|
| `--bg` | `#0A0A0B` |
| `--surface` | `#141417` |
| `--border` | `rgba(255,255,255,0.08)` |
| `--text` / `--text-muted` | `#EDEDEF` / `#A1A1AA` |
| `--accent` | aus Ghost `settings.accent_color` (Default `#6E8BFF`) |
| `--accent-gradient` | `linear-gradient(135deg, accent → violett/cyan)` |
| `--radius` | `16px` (Cards), `999px` (Pills) |
| `--font-sans` | variable Sans (Inter/Geist) via `next/font` (self-hosted) |

- Komponenten: Button (primär/sekundär/ghost), Card, Badge/Eyebrow, Nav, Footer, Section-Wrapper,
  Tag-Pill, Avatar, Quote.
- **Dark default**, Light-Mode optional (CSS-Var-Swap + `localStorage`), `prefers-reduced-motion` respektiert.
- **Akzentfarbe** aus Ghost gespeist (Inline-CSS-Var im `<head>`) → im Admin änderbar, ohne Deploy.

---

## 11. Redaktioneller Workflow (codefrei, Beispiele)

| Aufgabe | Im Ghost-Admin |
|---|---|
| Hero-Text/CTA ändern | Page `site-config` öffnen → JSON in Code-Card editieren → Veröffentlichen → Webhook revalidiert |
| Sektion aus-/einblenden | `site-config` → `sections.testimonials = false` |
| Akzentfarbe ändern | Einstellungen → Design → Brand-Color |
| Feature-Karte anlegen | Beiträge → Neu → Titel/Auszug/Feature-Bild → internes Tag `#feature` |
| Blogpost schreiben | Beiträge → Neu → Koenig → Tag `#de`/`#en` → Veröffentlichen |
| Navigation ändern | Einstellungen → Navigation |
| Neue Seite (Impressum) | Seiten → Neu → veröffentlichen |

---

## 12. Nicht-funktionale Anforderungen

- **Performance:** Lighthouse ≥ 90 (alle 4 Kategorien, Mobil); LCP < 2,5 s; minimales Client-JS
  (Server Components default), `next/image`, `next/font`.
- **A11y:** WCAG 2.1 AA – Kontraste, Fokus-States, Tastaturnav, `alt`, semantisches HTML, reduced-motion.
- **SEO:** Metadata-API (Title/OG/Twitter), `hreflang` DE/EN, `sitemap.xml`, `rss.xml`, JSON-LD
  (Article/Person), Canonicals.
- **Security:** TLS überall; Content-Key nur server-side; Admin-API-Key & Webhook-Secret via `.env`
  (nicht im Repo); Ghost-Admin hinter starkem Passwort/2FA; DB nicht öffentlich; aktuelle Versionen.
- **Datenschutz (DSGVO):** Impressum & Datenschutz als Ghost-Pages; **Analytics: Ghost-native,
  cookielose Analytics (entschieden)** – kein Cookie-Banner nötig; Member-Daten in Ghost.
- **Resilienz:** Frontend fällt bei Ghost-Ausfall auf zuletzt gebauten Stand zurück (ISR-Cache).
- **Wartbarkeit:** Monorepo, TypeScript, Lint/Format, dokumentiert, reproduzierbares Docker-Setup.

---

## 13. Infrastruktur & Deployment

- **`docker-compose.yml`** – Services:
  - `ghost` (Ghost 6, `url=https://cms.example.com`, Mail-SMTP), `mysql` (8),
    `frontend` (Next.js, Node 22, Prod-Build), `proxy` (Caddy, TLS + Routing beider Domains).
- **Konfiguration:** `.env` (Beispiel `.env.example` im Repo): Ghost-URL, DB-Creds, SMTP,
  `GHOST_CONTENT_API_KEY`, `GHOST_ADMIN_API_KEY`, `REVALIDATE_SECRET`. Secrets **nicht** committen.
- **Volumes:** `ghost_content`, `mysql_data`.
- **Mail:** SMTP-Provider (Mailgun/Postmark) für Member-Magic-Links/Newsletter.
- **Build/Deploy:** Frontend-Image baut Next.js (`output: 'standalone'`); Deploy via Compose;
  optional GitHub Action (Build + `docker compose up -d`).
- **Webhooks einrichten:** nach erstem Start Ghost-Integration anlegen, Webhooks → `/api/revalidate`.
- **Backups:** täglich `mysqldump` + `ghost_content`-Archiv; Restore getestet.
- **Monitoring (optional):** Uptime-Check, Logs.

---

## 14. Repository-Struktur (Ziel)

```
webseite-ghost/
├─ ANFORDERUNGEN.md
├─ docker/
│  ├─ docker-compose.yml
│  ├─ .env.example
│  └─ Caddyfile
├─ frontend/                 # Next.js (App Router, TS)  – siehe §9
├─ scripts/                  # seed.ts (Admin API), backup.sh, setup-webhooks.ts
└─ docs/                     # Redaktions-Guide, API-Konventionen, Design-Tokens
```

---

## 15. Akzeptanzkriterien (Definition of Done)

- [ ] `docker compose up` startet Ghost 6 + MySQL + Next.js + Caddy (beide Domains via TLS).
- [ ] Next.js liest Inhalte über die **Content API** (paginiert, ≤100/Seite respektiert).
- [ ] Startseite zeigt alle Sektionen aus §8 im Antigravity-Look (dunkel, responsive).
- [ ] **Jede** Sektion ist im Ghost-Admin ein-/ausblendbar und textlich editierbar – **ohne Code**
      (Config-Page + getaggte Inhalte + Settings).
- [ ] Ghost-**Webhook** → `/api/revalidate` aktualisiert betroffene Seiten ohne Vollrebuild.
- [ ] Blog funktioniert: Liste (paginiert), Einzelpost (Ghost-HTML inkl. `kg-*`-Cards), Tags, Autor, RSS.
- [ ] DE/EN umschaltbar; `hreflang`/`lang` korrekt; UI-Strings übersetzt.
- [ ] Newsletter-Signup über Ghost **Members** funktioniert.
- [ ] Lighthouse ≥ 90 (Mobil, alle Kategorien).
- [ ] Impressum & Datenschutz als Pages; cookielose Analytics aktiv.
- [ ] Backup-Skript erzeugt wiederherstellbares Backup; Redaktions-Guide in `docs/`.

---

## 16. Roadmap / Meilensteine

| M | Inhalt | Ergebnis |
|---|---|---|
| **M0** | Anforderungen (dieses Dokument) | Freigabe |
| **M1** | Docker-Compose: Ghost 6 + MySQL + Caddy | Ghost-Admin erreichbar |
| **M2** | Next.js-Grundgerüst + Content-API-Client (Pagination, zod) | Daten lesbar, Tokens/Layout |
| **M3** | Startseiten-Sektionen + Config-Page-Konvention | §8 vollständig, codefrei editierbar |
| **M4** | Blog/Pages/Tags/RSS + Ghost-HTML-Rendering | Redaktion möglich |
| **M5** | Webhooks → On-demand-Revalidation | ISR aktuell |
| **M6** | Mehrsprachigkeit DE/EN (Routing, Locales, Switcher) | zweisprachig |
| **M7** | Members/Newsletter + Suche | Hybrid-Features |
| **M8** | Politur: Performance/A11y/SEO/Motion | Lighthouse ≥ 90 |
| **M9** | Deployment, TLS, Backups, Doku | Produktiv + Guide |

---

## 17. Offene Punkte / Risiken

1. **Keine Custom-Fields in Ghost** → **Entschieden: Config-Page-JSON** (+ Tag-Konventionen).
   Mitigation gegen „kaputt editiertes" JSON: **`zod`-Schema** mit klaren Fehlermeldungen, sinnvolle
   Defaults/Fallbacks bei Validierungsfehler (Seite bleibt baubar), und ein **Redaktions-Guide** in
   `docs/` mit kommentiertem Beispiel-JSON.
2. **Webhook-Zuverlässigkeit:** verpasste Events → periodischer Fallback-Revalidate (Zeit-basiert)
   zusätzlich zu Event-basiert.
3. **Mehrsprachigkeit = doppelte Pflege**; Paarung per Konvention (akzeptiert).
4. **Ghost-6-Pagination (max 100):** generischer Paginations-Helper Pflicht.
5. **Aufwändige Antigravity-Animationen** vs. Performance → leichtgewichtige CSS/Canvas-Lösung.
6. **Inputs nötig:** Domain(s)/DNS, Logo/Brand/Akzentfarbe, SMTP, Startinhalte, Analytics-Präferenz.

---

## 18. Vom Nutzer benötigt (Inputs)

- Domains: `example.com` (Web) + `cms.example.com` (Ghost) + DNS-Zugriff
- Logo / Markenname / Akzentfarbe(n)
- SMTP-Zugang (Members/Newsletter)
- Startinhalte: Hero-Texte, „Über mich", erste Blogposts, Impressum/Datenschutz
- ~~Analytics-Präferenz~~ → **entschieden: Ghost-native cookielose Analytics**

---

*Nächster Schritt nach Freigabe: M1 (Docker-Compose mit Ghost 6 + MySQL + Caddy) und
M2 (Next.js-Grundgerüst + Content-API-Client).*
