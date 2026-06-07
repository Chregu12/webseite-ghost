# Anforderungen: Persönliche Webseite & Blog mit Ghost (Antigravity-Look)

> **Status:** Entwurf v1 · **Datum:** 2026-06-07 · **Branch:** `claude/ghost-website-editable-backend-eOKji`
> **Ziel dieses Dokuments:** Eine vollständige, umsetzbare End-to-End-Spezifikation, bevor Code geschrieben wird.

---

## 1. Vision & Ziel

Eine **persönliche Webseite mit Blog**, die optisch und vom Aufbau her an
[antigravity.google](https://antigravity.google/) angelehnt ist (modernes, dunkles,
„agentic-tech"-Design), aber inhaltlich **vollständig über das Ghost-Admin-Panel
pflegbar** ist – **ohne dass Code angefasst werden muss** (Anspruch: „so wie bei WordPress").

### Leitprinzipien
1. **Content-driven:** Jeder sichtbare Text, jedes Bild, jede Sektion, jeder Link und jede
   Farbe der Startseite ist im Admin editierbar. Kein „Text steht im Template fest".
2. **Kein Code zum Pflegen:** Redaktioneller Alltag (Blogpost schreiben, Hero-Text ändern,
   Sektion ein-/ausblenden, Navigation anpassen) passiert ausschließlich im Ghost-Admin.
3. **Zweisprachig (DE + EN):** Inhalte und UI in Deutsch und Englisch, mit Sprachumschalter.
4. **Self-hosted:** Betrieb via Docker, volle Datenhoheit, reproduzierbares Setup.
5. **Modern & schnell:** Dunkles Design, gute Core-Web-Vitals, A11y- und SEO-tauglich.

### Nicht-Ziele (v1)
- Kein E-Commerce / Shop.
- Kein 1:1-Klon der Antigravity-Inhalte (nur Stil & Struktur als Vorbild).
- Keine komplexe Mehrmandantenfähigkeit.

---

## 2. Referenz-Design-Analyse (Antigravity-Look)

Beobachteter Stil von Google Antigravity, übertragen auf eine persönliche Seite:

| Merkmal | Antigravity | Übernahme für unsere Seite |
|---|---|---|
| **Grundton** | Sehr dunkel (fast schwarz), hoher Kontrast | Dunkles Theme als Default (heller Modus optional) |
| **Akzentfarben** | Google-Spektrum, dezente Verläufe (Blau/Violett/Cyan) | 1–2 Akzentfarben + Verlauf, im Admin einstellbar |
| **Typografie** | Große, fette Sans-Serif-Headlines; klare Body-Schrift | Variable Sans (z. B. Inter / Geist / Google Sans-ähnlich) |
| **Hero** | Riesige Headline, kurzer Subtext, prominente CTAs, animiertes/3D-Visual | Editierbarer Hero mit Headline, Subtext, 2 CTAs, Hintergrund-Visual |
| **Sektionen** | Feature-Blöcke, abwechselnd Text/Visual, Karten mit Rundungen & feinen Rändern | Wiederverwendbare, editierbare Sektionstypen (siehe §6) |
| **Logo-/Model-Leiste** | „Powered by"-Logos | „Tools/Skills/Logos"-Leiste, editierbar |
| **Cards** | Abgerundete Ecken, subtile Border, leichter Glow/Glas-Effekt | Karten-Komponente mit denselben Tokens |
| **Whitespace** | Großzügig, ruhig | Großzügige vertikale Rhythmik |
| **Animation** | Subtile Scroll-/Hover-Effekte | Dezente, performante Effekte (reduziert bei `prefers-reduced-motion`) |

> Quellen zum Stil: [Google Developers Blog – Antigravity](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/),
> [antigravity.google](https://antigravity.google/).

---

## 3. Technische Architektur

```
                 ┌─────────────────────────────────────────────┐
   Besucher ───► │  Reverse Proxy (Caddy/Nginx) + TLS (Let's Encrypt)
                 └───────────────┬─────────────────────────────┘
                                 │
                    ┌────────────▼───────────┐      ┌──────────────────┐
                    │  Ghost (Node, Docker)  │◄────►│  MySQL 8 (Docker) │
                    │  - Custom Theme        │      └──────────────────┘
                    │  - Routes/Collections  │
                    │  - Theme Settings      │      ┌──────────────────┐
                    │  - Content API         │◄────►│  Volumes:        │
                    └────────────────────────┘      │  content/, db/   │
                                                     └──────────────────┘
```

- **CMS:** Ghost (neueste stabile Version), self-hosted im Docker-Container.
- **DB:** MySQL 8 (Ghost-empfohlen), eigener Container, persistentes Volume.
- **Reverse Proxy:** Caddy (automatisches TLS) **oder** Nginx + Certbot.
- **Theme:** **Eigenes Custom-Theme** (Handlebars `.hbs`), das die Editierbarkeit ermöglicht.
- **Persistenz:** Docker-Volumes für `content/` (Bilder, Theme, Settings) und MySQL-Daten.
- **Backups:** Tägliches DB-Dump + `content/`-Snapshot (Cron / Skript).

### Warum Custom-Theme statt fertigem Theme?
Der Antigravity-Look + die WordPress-artige Editierbarkeit jeder Sektion ist mit einem
Standard-Theme nicht abbildbar. Das Custom-Theme nutzt gezielt Ghosts Mechanismen
(Theme-Settings, dynamische Routen, strukturierte Inhalte), um Redakteur:innen volle
Kontrolle ohne Code zu geben (Details §5).

---

## 4. Editierbarkeit „wie WordPress" – wie Ghost das leistet

Ghost ist bewusst schlanker als WordPress. Die geforderte „alles ohne Code anpassbar"-Erfahrung
wird über die **Kombination** dieser vier Ghost-Mechanismen erreicht:

### 4.1 Theme-Custom-Settings (globale, getippte Felder)
In `package.json` deklarierte Settings erscheinen im Admin unter **Design → Branding/Theme**
als echte UI-Felder. Unterstützte Typen: `select`, `boolean`, `color`, `image`, `text`.
Damit editierbar **ohne Code**:
- Akzentfarbe(n), Hintergrundton, Hell/Dunkel-Default
- Hero-Headline, Hero-Subtext, CTA-Beschriftungen & -Links
- Sektionen ein-/ausblenden (Booleans), Reihenfolge-Varianten (Select)
- Logos/Footer-Text, Social-Links

> Hinweis/Grenze: Ghost erlaubt eine begrenzte Anzahl solcher Settings. Wir gruppieren sie
> sinnvoll (Branding, Hero, Sektionen, Footer) und lagern „beliebig viele" Inhalte (z. B.
> Feature-Karten) in strukturierte Inhalte aus (4.2).

### 4.2 Strukturierte Inhalte über Posts/Pages + interne Tags
Wiederholbare Elemente (Feature-Karten, Logos, Testimonials, Portfolio-Projekte) werden als
**Beiträge mit internem Tag** gepflegt (z. B. `#feature`, `#logo`, `#project`). Das Theme
durchläuft diese und rendert die Sektion. Redaktion = einfach einen neuen Beitrag mit dem Tag
anlegen → Karte erscheint automatisch. Felder: Titel, Auszug, Feature-Bild, Link, Reihenfolge.

### 4.3 Koenig-Editor (Block-/Card-basierte Seiten)
Freie Inhaltsseiten (z. B. „Über mich", Blogposts) werden mit Ghosts visuellem Editor gebaut:
Überschriften, Bilder, Galerien, Buttons, Callouts, Embeds, HTML-Cards, Snippets
(wiederverwendbare Blöcke). Das deckt freie Layouts WordPress-artig ab.

### 4.4 Dynamische Routen & Collections (`routes.yaml`)
Steuert URL-Struktur, Sprach-Collections und welche Seite als Startseite dient – konfigurierbar
ohne Theme-Code (siehe §7 und §8).

**Fazit:** „Globales/Layout" → Theme-Settings · „Listen/Karten" → getaggte Inhalte ·
„Freitext-Seiten" → Koenig-Editor · „Struktur/URLs" → routes.yaml. Zusammen ergibt das die
geforderte codefreie Pflege.

---

## 5. Mehrsprachigkeit (DE + EN)

Ghost hat **keine native Content-Übersetzung**. Empfohlener, Ghost-nativer Ansatz:

### 5.1 Ansatz (empfohlen): Tag-Collections + Theme-Locales
1. **UI-Strings** (Buttons, Labels, „Lesen", „Veröffentlicht am" …) über Ghosts
   Übersetzungsdateien `locales/de.json` und `locales/en.json` mit dem `{{t}}`-Helper.
2. **Inhalte** zweifach pflegen, getrennt über interne Tags `#de` / `#en`.
3. **`routes.yaml`** legt Collections `/de/...` und `/en/...` an, gefiltert nach Tag.
4. **Sprachumschalter** im Header (Theme-Partial), der zur jeweils anderen Sprachversion
   verlinkt (Paarung via Slug-Konvention, z. B. `mein-post` ↔ `my-post`, oder via internem Tag).
5. `<html lang>` und `hreflang`-Tags pro Sprache für SEO.

**Vorteile:** kein externer Dienst, volle Datenhoheit, sauberes SEO.
**Aufwand/Grenze:** Inhalte werden doppelt gepflegt; Paarung der Sprachversionen ist manuell/per Konvention.

### 5.2 Alternative (geringerer Pflegeaufwand): Übersetzungs-Overlay
Dienst wie Weglot/Crowdin-In-Context als JS-Overlay. Schneller, aber kostenpflichtig, weniger
SEO-sauber und nicht „echt" zweisprachig im CMS. **Nicht empfohlen** für eine persönliche Seite,
als Option dokumentiert.

> **Entscheidung v1:** Ansatz 5.1 (Tag-Collections + Locales).

---

## 6. Sitemap & Seitenstruktur

```
/                      Startseite (Antigravity-Stil, modulare Sektionen)  ──► default DE
/en/                   Startseite EN
/about, /en/about      Über mich
/blog/, /en/blog/      Blog-Übersicht (Collection)
/blog/<slug>           Einzelner Blogpost
/projects/             (optional) Portfolio/Projekte (getaggte Inhalte)
/contact, /en/contact  Kontakt
/tag/<slug>            Tag-Archiv
/author/<slug>         Autorenseite
/rss/                  Feed
/sitemap.xml, /robots.txt
404                    Fehlerseite
```

### Globale Bausteine (auf allen Seiten, editierbar)
- **Header:** Logo (Bild/Text), Hauptnavigation (Ghost-Navigation-Settings), Sprachumschalter, Theme-Toggle, primärer CTA.
- **Footer:** Footer-Navigation, Social-Links, Copyright/Impressum-Links, Newsletter-Anmeldung (Ghost Members, optional).

---

## 7. Startseiten-Sektionen (modular, je editierbar)

Jede Sektion ist **ein-/ausblendbar** (Theme-Setting Boolean) und ihre Texte/Bilder/Links sind
editierbar. Inhalts-Quelle pro Sektion in Klammern.

| # | Sektion | Inhalt & editierbare Felder | Quelle |
|---|---|---|---|
| 1 | **Hero** | Headline, Subtext, CTA-1 (Text+Link), CTA-2 (Text+Link), Hintergrund-Visual/Bild, optionaler Badge/Eyebrow | Theme-Settings + Bild |
| 2 | **Logo-/Skills-Leiste** | Überschrift + Liste von Logos/Tags mit Link | Getaggte Inhalte `#logo` |
| 3 | **Feature-Highlights** | 3–6 Karten: Icon/Bild, Titel, Text, Link | Getaggte Inhalte `#feature` |
| 4 | **Split-Showcase** | Abwechselnd Text/Visual-Blöcke (z. B. „Was ich mache") | Getaggte Inhalte `#showcase` |
| 5 | **Neueste Blogposts** | Automatische Liste der letzten N Posts (Bild, Titel, Datum, Auszug) | Posts-Collection |
| 6 | **Zitat/Testimonial** | Zitat, Person, Rolle, Avatar | Getaggte Inhalte `#testimonial` |
| 7 | **Call-to-Action-Band** | Headline, Subtext, Button | Theme-Settings |
| 8 | **Newsletter** (optional) | Überschrift, Text, Anmeldeformular | Ghost Members |

> Reihenfolge v1 fest verdrahtet im Template, Sichtbarkeit pro Sektion per Toggle.
> Optional v2: Reihenfolge per Select-Setting umstellbar.

---

## 8. Theme-Architektur (Custom Ghost Theme)

```
theme/
├─ package.json            # Name, Version, custom-Settings (Editierbarkeit!), engines
├─ routes.yaml             # Routen, Sprach-Collections, Startseite
├─ default.hbs            # Globales Layout (Header/Footer, <head>, lang/hreflang)
├─ index.hbs             # Blog-Listing (Collection-Default)
├─ home.hbs              # Startseite mit modularen Sektionen (§7)
├─ post.hbs              # Einzelner Blogpost
├─ page.hbs              # Statische Seite (About/Contact)
├─ tag.hbs              # Tag-Archiv
├─ author.hbs           # Autorenseite
├─ error.hbs / error-404.hbs
├─ partials/
│  ├─ header.hbs        # Nav, Sprachswitch, Theme-Toggle, CTA
│  ├─ footer.hbs
│  ├─ sections/        # hero.hbs, features.hbs, showcase.hbs, cta.hbs, …
│  ├─ card-post.hbs
│  └─ lang-switcher.hbs
├─ locales/
│  ├─ de.json
│  └─ en.json
├─ assets/
│  ├─ css/             # Design-Tokens + Komponenten (kompiliert)
│  ├─ js/              # Theme-Toggle, dezente Animationen, Menü
│  └─ images/
└─ gulpfile.js / build  # Asset-Build (PostCSS/Tailwind o. ä.)
```

- **Tooling:** Asset-Build (z. B. PostCSS/Tailwind oder schlankes CSS mit Custom Properties).
  Antigravity-Look über **CSS-Variablen** (Tokens), die teils aus Theme-Settings gespeist werden
  (z. B. Akzentfarbe als Inline-Variable im `<head>`), damit Farbe ohne Code editierbar ist.
- **Validierung:** Theme muss `gscan` (Ghosts Theme-Validator) ohne Fehler bestehen.
- **Standards:** Ghost-Helper (`{{ghost_head}}`, `{{ghost_foot}}`, `{{navigation}}`, `{{content}}`,
  `{{#get}}`, `{{#foreach}}`, `{{t}}`, `{{@custom.*}}`).

### Beispiel: editierbare Felder (`package.json` → `config.custom`)
- `accent_color` (color), `background_style` (select: dark/light), `site_logo` (image)
- `hero_headline` (text), `hero_subtitle` (text), `hero_cta_primary_label/url` (text)
- `show_logos`, `show_features`, `show_testimonials`, `show_newsletter` (boolean)
- `footer_text` (text)

---

## 9. Design-System / Tokens

| Token | Wert (Vorschlag, im Admin überschreibbar wo sinnvoll) |
|---|---|
| `--bg` | `#0A0A0B` (dark default) |
| `--surface` | `#141417` (Karten) |
| `--border` | `rgba(255,255,255,0.08)` |
| `--text` | `#EDEDEF` |
| `--text-muted` | `#A1A1AA` |
| `--accent` | aus Theme-Setting (Default z. B. `#6E8BFF`) |
| `--accent-gradient` | `linear-gradient(135deg, accent → violett/cyan)` |
| `--radius` | `16px` (Karten), `999px` (Pills/Buttons) |
| `--font-sans` | Inter / Geist / „Google-Sans-like", variabel |
| `--space-section` | großzügige vertikale Sektionsabstände |

- **Komponenten:** Button (primär/sekundär/ghost), Card, Badge/Eyebrow, Nav, Footer,
  Section-Wrapper, Tag-Pill, Avatar, Quote.
- **Dark/Light:** Dunkel als Default; Light-Mode optional via Theme-Toggle (CSS-Variablen-Swap,
  Präferenz in `localStorage`).
- **Motion:** Subtile Fade/Slide-In beim Scrollen, Hover-Glow auf Karten; vollständig
  deaktiviert bei `prefers-reduced-motion`.

---

## 10. Redaktioneller Workflow (Beispiele, codefrei)

| Aufgabe | Schritte im Admin |
|---|---|
| Hero-Text ändern | Design → Theme-Settings → `hero_headline` editieren → Speichern |
| Sektion ausblenden | Design → Theme-Settings → `show_testimonials` = off |
| Akzentfarbe ändern | Design → Theme-Settings → `accent_color` |
| Feature-Karte hinzufügen | Beiträge → Neu → Inhalt + Feature-Bild → internes Tag `#feature` |
| Blogpost schreiben | Beiträge → Neu → Koenig-Editor → Tag `#de` oder `#en` → Veröffentlichen |
| Navigation ändern | Einstellungen → Navigation |
| Neue Seite (z. B. Impressum) | Seiten → Neu → Inhalt → veröffentlichen |
| Logo/Branding | Design → Branding |

---

## 11. Nicht-funktionale Anforderungen

- **Performance:** Lighthouse ≥ 90 (Performance/SEO/Best Practices/A11y) auf Mobil & Desktop;
  LCP < 2,5 s; Bilder responsive (Ghosts `srcset`/`{{img_url}}`), Lazy-Loading; minimal JS.
- **Accessibility:** WCAG 2.1 AA – Kontraste, Fokus-States, Tastaturnav, `alt`-Texte,
  semantisches HTML, `prefers-reduced-motion`.
- **SEO:** Saubere Meta/OpenGraph/Twitter-Cards (Ghost-nativ), `sitemap.xml`, `hreflang` DE/EN,
  strukturierte Daten (JSON-LD via Ghost), sprechende URLs.
- **Security:** TLS überall, aktuelle Ghost-Version, DB nicht öffentlich exponiert, Admin hinter
  starkem Passwort/2FA, Secrets via `.env` (nicht im Repo), regelmäßige Updates.
- **Datenschutz:** DSGVO – Impressum & Datenschutzerklärung (als Ghost-Pages), Cookie-/Analytics-
  Hinweis falls Tracking, ggf. Plausible/umami statt GA (cookielos).
- **Browser-Support:** aktuelle Versionen Chrome/Firefox/Safari/Edge; responsive ab ~320 px.
- **Wartbarkeit:** Theme im Repo versioniert, dokumentiert, `gscan`-clean, reproduzierbares
  Docker-Setup.

---

## 12. Infrastruktur & Deployment

- **`docker-compose.yml`:** Services `ghost`, `mysql`, `proxy` (Caddy/Nginx).
- **Konfiguration:** via Environment-Variablen (`url`, `database__*`, `mail__*`) in `.env`
  (Beispiel als `.env.example` im Repo, echte Secrets nicht committen).
- **Mail:** Transaktionsmail (Member-Login/Newsletter) via SMTP-Provider (z. B. Mailgun/Postmark).
- **Volumes:** `ghost_content` (inkl. Theme & Bilder), `mysql_data`.
- **TLS:** Caddy automatisch oder Nginx+Certbot.
- **CI/Deploy (optional):** Theme-Build + Upload via Ghost-Admin-API oder `ghost`-CLI; GitHub Action.
- **Backups:** tägliches `mysqldump` + `content/`-Archiv, Aufbewahrung rotierend, Restore getestet.
- **Monitoring (optional):** Uptime-Check + Logaggregation.

---

## 13. Repository-Struktur (Ziel)

```
webseite-ghost/
├─ ANFORDERUNGEN.md            # dieses Dokument
├─ docker/
│  ├─ docker-compose.yml
│  ├─ .env.example
│  └─ Caddyfile / nginx.conf
├─ theme/                      # Custom Ghost Theme (siehe §8)
├─ scripts/                    # backup.sh, deploy.sh
└─ docs/                       # weitere Doku (Design-Tokens, Redaktions-Guide)
```

---

## 14. Akzeptanzkriterien (Definition of Done)

- [ ] Ghost läuft reproduzierbar via `docker compose up` (DB + Proxy + TLS).
- [ ] Custom-Theme installiert, besteht `gscan` ohne Fehler/Warnungen.
- [ ] Startseite zeigt alle Sektionen aus §7 im Antigravity-Look (dunkel, responsive).
- [ ] **Jede** in §7 genannte Sektion ist im Admin ein-/ausblendbar und textlich editierbar – **ohne Code**.
- [ ] Akzentfarbe, Hero-Texte, Logo, Navigation und Footer im Admin änderbar.
- [ ] Blog funktioniert: Liste, Einzelpost, Tags, Autor, RSS.
- [ ] DE/EN umschaltbar; `hreflang` und `lang`-Attribute korrekt; UI-Strings übersetzt.
- [ ] Lighthouse ≥ 90 in allen vier Kategorien (Mobil).
- [ ] Impressum & Datenschutz als Pages vorhanden.
- [ ] Backup-Skript erzeugt wiederherstellbares DB+Content-Backup.
- [ ] Redaktions-Kurzanleitung (`docs/`) vorhanden.

---

## 15. Roadmap / Meilensteine

| M | Inhalt | Ergebnis |
|---|---|---|
| **M0** | Anforderungen (dieses Dokument) | Freigabe der Spec |
| **M1** | Docker-Setup | Ghost lokal lauffähig, leeres Theme |
| **M2** | Theme-Grundgerüst + Design-Tokens | Layout, Header/Footer, Dark-Theme |
| **M3** | Startseiten-Sektionen + Editierbarkeit | §7 vollständig, Theme-Settings live |
| **M4** | Blog + Pages + Tags + RSS | Redaktion möglich |
| **M5** | Mehrsprachigkeit DE/EN | routes.yaml, locales, Switcher |
| **M6** | Politur: Performance, A11y, SEO, Animation | Lighthouse ≥ 90 |
| **M7** | Deployment, TLS, Backups, Doku | Produktiv + Redaktions-Guide |

---

## 16. Offene Punkte / Risiken

1. **Theme-Settings-Limit:** Ghost begrenzt Anzahl/Typ der Custom-Settings. Mitigation:
   strukturierte Inhalte (Tags) für „beliebig viele" Elemente; Settings nur für globales Layout.
2. **Mehrsprachigkeit ist Mehraufwand:** Inhalte doppelt pflegen; Paarung der Sprachversionen
   per Konvention. Entscheidung 5.1 akzeptiert das bewusst.
3. **„Sektionsreihenfolge frei verschieben"** ist in Ghost nur eingeschränkt möglich
   (v1: Toggles; v2: Select-Varianten). Voll freies Drag&Drop wie WordPress-Pagebuilder ist
   nicht Ghost-nativ – bewusst außerhalb v1.
4. **Antigravity-Visuals (3D/Animation):** Aufwändige Hero-Animationen kosten Performance.
   Mitigation: leichtgewichtige CSS/Canvas-Lösung statt schwerer Libraries.
5. **Domain, Logo/Brand-Assets, finale Inhalte (Texte/Bilder)** werden vom Nutzer benötigt.

---

## 17. Vom Nutzer benötigt (Inputs)

- Domain-Name + DNS-Zugriff
- Logo / Markenname / gewünschte Akzentfarbe(n)
- SMTP-Zugang (für Member/Newsletter) – optional in v1
- Startinhalte: Hero-Text, „Über mich", erste Blogposts, Impressum/Datenschutz-Daten
- Präferenz Analytics (keines / Plausible / umami / GA)

---

*Nächster Schritt nach Freigabe: M1 (Docker-Setup) + M2 (Theme-Grundgerüst).*
