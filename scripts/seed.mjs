#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Demo-content seeder for local development.
//
// Creates/updates the pages and tagged posts that drive the homepage sections,
// so you can see the site populated immediately after a fresh Ghost install.
//
// Usage:
//   GHOST_URL=http://localhost:2368 \
//   GHOST_ADMIN_API_KEY=<id>:<secret> \
//   node scripts/seed.mjs
//
// The Admin API key comes from a Custom Integration in Ghost Admin
// (Settings -> Integrations -> Add custom integration).
//
// Idempotent: pages are matched by slug and updated in place (so it won't
// duplicate Ghost's built-in "about" page), posts are matched by slug too.
// ---------------------------------------------------------------------------
import crypto from "node:crypto";

const GHOST_URL = (process.env.GHOST_URL ?? "http://localhost:2368").replace(/\/$/, "");
const ADMIN_KEY = process.env.GHOST_ADMIN_API_KEY ?? "";

if (!ADMIN_KEY || !ADMIN_KEY.includes(":")) {
  console.error("Set GHOST_ADMIN_API_KEY=<id>:<secret> (from a Ghost custom integration).");
  process.exit(1);
}

const API = `${GHOST_URL}/ghost/api/admin`;

function makeToken() {
  const [id, secret] = ADMIN_KEY.split(":");
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const data = `${b64({ alg: "HS256", typ: "JWT", kid: id })}.${b64({
    iat: now,
    exp: now + 300,
    aud: "/admin/",
  })}`;
  const sig = crypto
    .createHmac("sha256", Buffer.from(secret, "hex"))
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

const headers = () => ({
  Authorization: `Ghost ${makeToken()}`,
  "Content-Type": "application/json",
  "Accept-Version": "v6.0",
});

async function findBySlug(resource, slug) {
  const res = await fetch(
    `${API}/${resource}/?filter=${encodeURIComponent(`slug:${slug}`)}&limit=1`,
    { headers: headers() },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json[resource]?.[0] ?? null;
}

async function upsert(resource, slug, data) {
  const existing = await findBySlug(resource, slug);
  const method = existing ? "PUT" : "POST";
  const path = existing
    ? `${API}/${resource}/${existing.id}/?source=html`
    : `${API}/${resource}/?source=html`;
  const body = existing ? { ...data, updated_at: existing.updated_at } : data;

  const res = await fetch(path, {
    method,
    headers: headers(),
    body: JSON.stringify({ [resource]: [{ slug, ...body }] }),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`  ✗ ${resource} ${slug}:`, JSON.stringify(json).slice(0, 200));
    return;
  }
  console.log(`  ${existing ? "↻" : "+"} ${resource}: ${data.title ?? slug}`);
}

const codeBlock = (json) => `<pre><code>${JSON.stringify(json, null, 2)}</code></pre>`;

const siteConfig = (lang) => ({
  hero: {
    eyebrow: lang === "en" ? "Personal blog" : "Persönlicher Blog",
    headline:
      lang === "en"
        ? "I build things with code & AI"
        : "Ich baue Dinge mit Code & KI",
    subtitle:
      lang === "en"
        ? "Thoughts, projects and experiments around software and automation."
        : "Gedanken, Projekte und Experimente rund um Software und Automatisierung.",
    ctaPrimary: {
      label: lang === "en" ? "Read the blog" : "Blog lesen",
      url: `/${lang}/blog`,
    },
    ctaSecondary: {
      label: lang === "en" ? "About" : "Über mich",
      url: `/${lang}/about`,
    },
    visual: null,
  },
  sections: {
    logos: true,
    features: true,
    showcase: true,
    latestPosts: true,
    testimonials: true,
    newsletter: true,
  },
  content: {
    logos: { title: lang === "en" ? "What I work with" : "Womit ich arbeite" },
    features: {
      title: lang === "en" ? "What I do" : "Was ich mache",
      intro: lang === "en" ? "A few focus areas." : "Ein paar Schwerpunkte.",
    },
    showcase: {
      title: lang === "en" ? "Selected projects" : "Ausgewählte Projekte",
      intro: "",
    },
    testimonials: { title: lang === "en" ? "Voices" : "Stimmen", intro: "" },
    newsletter: {
      title: lang === "en" ? "Stay in the loop" : "Bleib auf dem Laufenden",
      intro:
        lang === "en"
          ? "New posts straight to your inbox."
          : "Neue Beiträge direkt per E-Mail.",
      buttonLabel: lang === "en" ? "Subscribe" : "Abonnieren",
    },
  },
  footer: {
    text: "© 2026 Christian — Ghost & Next.js",
    social: { github: "https://github.com/", mastodon: "https://mastodon.social/" },
  },
});

const tagged = (internal, lang, title, excerpt, html) => ({
  title,
  ...(excerpt ? { custom_excerpt: excerpt } : {}),
  ...(html ? { html } : {}),
  status: "published",
  tags: [{ name: `#${internal}` }, { name: `#${lang}` }],
});

async function main() {
  console.log(`Seeding ${GHOST_URL} …`);

  await upsert("pages", "site-config", {
    title: "Site Config",
    html: codeBlock(siteConfig("de")),
    status: "published",
  });
  await upsert("pages", "site-config-en", {
    title: "Site Config EN",
    html: codeBlock(siteConfig("en")),
    status: "published",
  });

  // Updates Ghost's built-in About page in place (matched by slug).
  await upsert("pages", "about", {
    title: "Über mich",
    html: "<p>Hallo! Ich bin Christian und schreibe hier über Software, KI und Automatisierung.</p>",
    status: "published",
  });
  await upsert("pages", "contact", {
    title: "Kontakt",
    html: "<p>Schreib mir gern an <a href='mailto:hallo@example.com'>hallo@example.com</a>.</p>",
    status: "published",
  });

  const features = [
    ["web-entwicklung", "Web-Entwicklung", "Moderne Sites mit Next.js, React und TypeScript."],
    ["automatisierung", "Automatisierung", "Workflows und Tools, die mir Arbeit abnehmen."],
    ["ki-integration", "KI-Integration", "LLMs sinnvoll in Produkte einbauen."],
  ];
  for (const [slug, t, ex] of features)
    await upsert("posts", slug, tagged("feature", "de", t, ex));

  for (const name of ["Next.js", "Ghost", "TypeScript", "Docker"])
    await upsert("posts", `logo-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      tagged("logo", "de", name));

  const showcase = [
    ["projekt-alpha", "Projekt Alpha", "Eine Plattform für automatisierte Reports."],
    ["projekt-beta", "Projekt Beta", "Ein kleines KI-Tool für den Alltag."],
  ];
  for (const [slug, t, ex] of showcase)
    await upsert("posts", slug, tagged("showcase", "de", t, ex));

  const testimonials = [
    ["t-anna", "Großartige Arbeit, sehr zuverlässig!", "Anna B. — Kundin"],
    ["t-max", "Schnell, sauber, durchdacht.", "Max M. — Kollege"],
  ];
  for (const [slug, quote, person] of testimonials)
    await upsert("posts", slug, tagged("testimonial", "de", quote, person));

  const posts = [
    ["mein-erster-beitrag", "Mein erster Beitrag", "<p>Willkommen auf meinem neuen Blog!</p>"],
    ["warum-headless-ghost", "Warum headless Ghost", "<p>Ghost als CMS, Next.js als Frontend.</p>"],
    ["automatisierung-im-alltag", "Automatisierung im Alltag", "<p>Wie kleine Skripte Zeit sparen.</p>"],
  ];
  for (const [slug, t, html] of posts)
    await upsert("posts", slug, {
      ...tagged("de", "de", t, `${t} — ein kurzer Einblick.`, html),
      tags: [{ name: "#de" }, { name: "Allgemein" }],
    });

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
