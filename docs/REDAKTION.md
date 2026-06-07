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

- **Über mich:** Seite mit Slug `about` (DE) bzw. `about-en` (EN).
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
