# Redaktions-Guide (codefrei pflegen)

Alles auf der Webseite wird im **Ghost-Admin** gepflegt – kein Code nötig. Dieser Guide erklärt
die Konventionen, an die sich das Frontend hält.

## 1. Globale Texte & Sektions-Schalter — die `site-config`-Seite

Hero-Texte, CTA-Buttons, Footer und das Ein-/Ausblenden von Sektionen kommen aus einer
**Seite** (nicht Beitrag) mit dem **Slug `site-config`** (Deutsch) bzw. **`site-config-en`**
(Englisch). Inhalt ist **ein einzelner Code-Block** mit folgendem JSON:

```json
{
  "hero": {
    "eyebrow": "Persönlicher Blog",
    "headline": "Ich baue Dinge mit Code & KI",
    "subtitle": "Gedanken, Projekte und Experimente.",
    "ctaPrimary":   { "label": "Blog lesen", "url": "/de/blog" },
    "ctaSecondary": { "label": "Über mich",  "url": "/de/about" },
    "visual": "https://cms.example.com/content/images/hero.png"
  },
  "sections": {
    "logos": true,
    "features": true,
    "showcase": true,
    "latestPosts": true,
    "testimonials": false,
    "newsletter": true
  },
  "content": {
    "logos": { "title": "Womit ich arbeite" },
    "features": { "title": "Was ich mache", "intro": "Kurzer Untertitel." },
    "showcase": { "title": "Ausgewählte Projekte", "intro": "" },
    "testimonials": { "title": "Stimmen", "intro": "" },
    "newsletter": { "title": "Bleib auf dem Laufenden", "intro": "Neue Beiträge per Mail.", "buttonLabel": "Abonnieren" }
  },
  "footer": {
    "text": "© 2026 Mein Name",
    "social": { "github": "https://github.com/…", "mastodon": "https://…" }
  }
}
```

**So legst du sie an:** Ghost-Admin → **Seiten → Neu** → Titel z. B. „Site Config" → im Editor
`/` tippen → **Markdown**- oder **HTML-Card** mit einem Code-Block einfügen → JSON einsetzen →
**URL/Slug** in den Seiteneinstellungen auf `site-config` setzen → **Veröffentlichen**.

> Tipps:
> - Ungültiges JSON bricht **nichts** – das Frontend nutzt dann sichere Defaults (siehe Logs).
> - `visual` darf leer/`null` sein (dann kein Hero-Bild).
> - Für Englisch eine zweite Seite mit Slug `site-config-en` anlegen.

## 2. Blogbeiträge

- **Beiträge → Neu**, im Koenig-Editor schreiben.
- **Sprache zuweisen** über ein internes Tag: `#de` oder `#en`
  (internes Tag = beginnt mit `#`, taucht nicht öffentlich auf).
- Titel, **Auszug** (Beitrags-Einstellungen → Excerpt) und **Feature-Bild** werden in den
  Karten verwendet.

## 3. Wiederholbare Sektions-Elemente (ab M3)

Karten in Sektionen wie *Features*, *Logos*, *Testimonials* werden als **Beiträge mit internem
Tag** gepflegt:

| Sektion | Internes Tag | Genutzte Felder |
|---|---|---|
| Features | `#feature` | Titel, Auszug, Feature-Bild |
| Logos | `#logo` | Titel, Feature-Bild, (Link) |
| Showcase | `#showcase` | Titel, Auszug, Feature-Bild |
| Testimonials | `#testimonial` | Titel (Zitat), Auszug (Person/Rolle), Feature-Bild (Avatar) |

Zusätzlich Sprach-Tag `#de`/`#en` setzen. Reihenfolge = Veröffentlichungsdatum (aufsteigend).

## 3b. Seiten: Über mich & Kontakt

- **Über mich:** Ghost legt beim Setup automatisch eine Seite mit Slug **`about`** an
  („About this site"). **Einfach diese vorhandene Seite bearbeiten** – keine neue anlegen,
  sonst entsteht eine Dublette (`about-2`). Für Englisch eine Seite mit Slug `about-en`.
- **Kontakt:** Seite mit Slug `contact` (DE) bzw. `contact-en` (EN). Den Inhalt frei im
  Koenig-Editor gestalten – ein Kontaktformular lässt sich per **HTML-Card** einbetten
  (z. B. Formspree/Tally) oder einfach E-Mail/Social-Links angeben.
- **Suche:** läuft automatisch über alle Beiträge (`/de/search`), nichts zu pflegen.

## 4. Branding, Navigation, Akzentfarbe

- **Akzentfarbe / Logo / Icon:** Einstellungen → **Design** (wird live ins Frontend übernommen).
- **Navigation:** Einstellungen → **Navigation** (primär & sekundär).

## 5. Aktualität (Webhooks)

Nach **Veröffentlichen/Ändern** in Ghost wird das Frontend automatisch aktualisiert
(Webhook → `/api/revalidate`). Es kann wenige Sekunden dauern.

## 6. Newsletter & E-Mail (SMTP)

Die Newsletter-Anmeldung nutzt Ghost **Members** und verschickt einen **Magic-Link** per
E-Mail. Dafür muss in Ghost **SMTP konfiguriert** sein (in `docker/.env` die `MAIL_*`-Werte,
z. B. Mailgun/Postmark). Ohne SMTP schlägt das Versenden fehl (lokal normal) – die Anmeldung
funktioniert erst in Produktion mit gültigem Mail-Zugang.

## 7. Demo-Inhalte schnell anlegen (optional, für Entwickler)

Für eine frische lokale Installation kann mit einem Skript Beispiel-Inhalt erzeugt werden
(`site-config`, About/Kontakt, getaggte Beiträge). Voraussetzung: ein **Admin-API-Key** aus
einer Custom Integration (Einstellungen → Integrationen).

```bash
GHOST_URL=http://localhost:2368 \
GHOST_ADMIN_API_KEY=<id>:<secret> \
node scripts/seed.mjs
```

Das Skript ist **idempotent** (findet bestehende Inhalte per Slug und aktualisiert sie).

## 8. Entwurfs-Vorschau, Kontaktformular, ähnliche Beiträge

- **Entwurf vorab ansehen (Draft Preview):** Einen unveröffentlichten Beitrag mit dieser URL
  öffnen (Slug aus den Beitrags-Einstellungen):
  `https://<SITE_DOMAIN>/api/preview?secret=<PREVIEW_SECRET>&slug=<slug>&lang=de`
  → zeigt den Entwurf mit Banner; „Vorschau beenden" beendet sie. (`PREVIEW_SECRET` +
  `GHOST_ADMIN_API_KEY` müssen gesetzt sein.)
- **Kontaktformular:** Auf der `contact`-Seite wird automatisch ein Formular unter dem
  Seiteninhalt gerendert. Es versendet per SMTP an **`CONTACT_TO`** (siehe `docker/.env`).
- **Ähnliche Beiträge:** erscheinen automatisch unter jedem Beitrag (gleiches Haupt-Tag,
  sonst neueste Beiträge) — nichts zu pflegen.

## 9. Drag-&-Drop-Page-Builder

Seiten, die Startseite und Beiträge lassen sich visuell per Drag & Drop bauen (Puck):

- **Aufruf:** `https://<SITE_DOMAIN>/builder?key=<BUILDER_SECRET>&type=pages&slug=<slug>&lang=de`
  - `type=pages` für Seiten, `type=posts` für Blogbeiträge
  - `slug=home` (bzw. `home-en`) baut die **Startseite**
  - existiert der Slug noch nicht, wird die Seite beim ersten Speichern angelegt
- **Bedienung:** Blöcke aus der linken Leiste in die Mitte ziehen (Hero, Überschrift, Text,
  Bild, Button, Spalten, Sektion, CTA-Band, Abstand, Trennlinie), rechts die Felder bearbeiten,
  oben **Publish** klicken → wird in Ghost gespeichert und live geschaltet.
- **Spalten/Sektionen** haben eigene Ablagezonen → echtes verschachteltes Layout.
- Eine per Builder gebaute Seite/Startseite/Beitrag wird automatisch mit diesem Layout
  gerendert; ohne Builder-Layout greift der normale Ghost-Inhalt.

> Voraussetzung: `BUILDER_SECRET` und `GHOST_ADMIN_API_KEY` sind gesetzt (siehe `docker/.env`).

**Bequemer Weg (empfohlen): „Bearbeiten"-Button**
1. Einmal einloggen: `https://<SITE_DOMAIN>/api/builder/auth?key=<BUILDER_SECRET>&redirect=/de`
   (setzt ein Cookie für 8 Stunden).
2. Danach erscheint auf jeder editierbaren Seite unten links ein **„✎ Bearbeiten"**-Button,
   der direkt in den Builder dieser Seite/dieses Beitrags führt — ohne Secret in der URL.
3. Ausloggen: `https://<SITE_DOMAIN>/api/builder/auth?logout=1`.

**Blöcke:** Hero, Feature-Karten, Zitat, Logo-Leiste, CTA-Band, Überschrift, Text, Bild
(mit Upload), Button, Spalten, Sektion, Abstand, Trennlinie. Bilder lassen sich direkt im
Builder hochladen (landen in Ghost).
