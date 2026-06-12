#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Health / contract check — the upgrade gate.
//
// Run this after upgrading Ghost (or in CI). It asserts every invariant the
// frontend relies on, so a breaking change in a new Ghost version fails LOUDLY
// instead of silently degrading the site. Exit code 0 = all good, 1 = broken.
//
//   SITE_URL=http://localhost:3000 \
//   GHOST_URL=http://localhost:2368 \
//   GHOST_CONTENT_API_KEY=<key> \
//   node scripts/healthcheck.mjs
//
// SITE_URL  = the running Next.js frontend (required)
// GHOST_URL + GHOST_CONTENT_API_KEY = direct Ghost Content API checks (optional
//             but recommended: they verify the API contract our code depends on)
// ---------------------------------------------------------------------------

const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const GHOST_URL = (process.env.GHOST_URL ?? "http://localhost:2368").replace(/\/$/, "");
const KEY = process.env.GHOST_CONTENT_API_KEY ?? "";
const API_VERSION = process.env.GHOST_API_VERSION ?? "v6.0";

// Fields the frontend reads off a post/settings. Missing keys after an upgrade
// mean the API contract changed and the site will misrender.
const REQUIRED_POST_KEYS = [
  "id", "slug", "title", "html", "excerpt", "custom_excerpt",
  "feature_image", "published_at", "updated_at",
  "meta_title", "meta_description", "og_image", "twitter_image", "canonical_url",
];
const REQUIRED_SETTINGS_KEYS = ["title", "description", "navigation", "accent_color"];

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};

async function get(url, headers = {}) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  return { status: res.status, text };
}

async function ghostJson(path) {
  const sep = path.includes("?") ? "&" : "?";
  const { status, text } = await get(`${GHOST_URL}/ghost/api/content${path}${sep}key=${KEY}`, {
    "Accept-Version": API_VERSION,
  });
  if (status !== 200) throw new Error(`HTTP ${status}`);
  return JSON.parse(text);
}

async function check(name, fn) {
  try {
    const detail = await fn();
    record(name, true, detail ?? "");
  } catch (e) {
    record(name, false, e instanceof Error ? e.message : String(e));
  }
}

async function main() {
  console.log(`Healthcheck: frontend=${SITE_URL} ghost=${GHOST_URL} api=${API_VERSION}\n`);

  let firstSlug = null;
  let authorSlug = null;
  let commentsEnabled = null;

  // ---- Ghost Content API contract (optional, needs key) ----
  if (KEY) {
    await check("Ghost: settings reachable + required keys", async () => {
      const json = await ghostJson("/settings/");
      const s = json.settings ?? {};
      commentsEnabled = s.comments_enabled ?? null;
      const missing = REQUIRED_SETTINGS_KEYS.filter((k) => !(k in s));
      if (missing.length) throw new Error(`missing settings keys: ${missing.join(", ")}`);
      return `title="${s.title}"`;
    });

    await check("Ghost: authors endpoint returns an author", async () => {
      const json = await ghostJson("/authors/?limit=1");
      const a = json.authors?.[0];
      if (!a?.slug) throw new Error("no author");
      authorSlug = a.slug;
      return `slug="${a.slug}"`;
    });

    await check("Ghost: post shape has required fields", async () => {
      const json = await ghostJson("/posts/?limit=1&include=tags,authors&formats=html");
      const post = json.posts?.[0];
      if (!post) throw new Error("no posts returned");
      firstSlug = post.slug;
      const missing = REQUIRED_POST_KEYS.filter((k) => !(k in post));
      if (missing.length) throw new Error(`missing post keys: ${missing.join(", ")}`);
      return `slug="${post.slug}"`;
    });

    await check("Ghost: pagination meta present (max 100/page)", async () => {
      const json = await ghostJson("/posts/?limit=100&page=1");
      const p = json.meta?.pagination;
      if (!p || typeof p.pages !== "number") throw new Error("no pagination meta");
      if (p.limit > 100) throw new Error(`limit ${p.limit} > 100`);
      return `pages=${p.pages}`;
    });

    await check("Ghost: site-config page is valid JSON (config contract)", async () => {
      const json = await ghostJson("/pages/slug/site-config/?formats=plaintext");
      const raw = (json.pages?.[0]?.plaintext ?? "").trim();
      const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
      if (start === -1 || end <= start) throw new Error("no JSON object in site-config");
      const cfg = JSON.parse(raw.slice(start, end + 1));
      if (!cfg.hero || !cfg.sections) throw new Error("config missing hero/sections");
      return "ok";
    });
  } else {
    console.log("· (skipping direct Ghost checks — no GHOST_CONTENT_API_KEY)\n");
  }

  // ---- Frontend rendering & SEO/AEO surfaces ----
  await check("Frontend: home /de renders with WebSite JSON-LD", async () => {
    const { status, text } = await get(`${SITE_URL}/de`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!text.includes("application/ld+json")) throw new Error("no JSON-LD");
    if (!text.includes('"WebSite"')) throw new Error("no WebSite schema");
    if (!/<h1[ >]/.test(text)) throw new Error("no h1");
    return "";
  });

  await check("Frontend: /de/blog renders", async () => {
    const { status } = await get(`${SITE_URL}/de/blog`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
  });

  // Find a post slug if we don't have one yet (scrape the blog list).
  if (!firstSlug) {
    const { text } = await get(`${SITE_URL}/de/blog`);
    const m = text.match(/\/de\/blog\/([a-z0-9-]+)/i);
    firstSlug = m?.[1] ?? null;
  }

  await check("Frontend: a blog post renders with BlogPosting JSON-LD", async () => {
    if (!firstSlug) throw new Error("no post slug available");
    const { status, text } = await get(`${SITE_URL}/de/blog/${firstSlug}`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!text.includes('"BlogPosting"')) throw new Error("no BlogPosting schema");
    if (!text.includes('rel="canonical"')) throw new Error("no canonical");
    return `slug="${firstSlug}"`;
  });

  await check("Frontend: /llms.txt", async () => {
    const { status, text } = await get(`${SITE_URL}/llms.txt`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!text.startsWith("#")) throw new Error("not markdown");
  });

  await check("Frontend: robots.txt allows AI crawlers + sitemap", async () => {
    const { status, text } = await get(`${SITE_URL}/robots.txt`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!/GPTBot/i.test(text)) throw new Error("GPTBot not listed");
    if (!/Sitemap:/i.test(text)) throw new Error("no sitemap reference");
  });

  await check("Frontend: sitemap.xml", async () => {
    const { status, text } = await get(`${SITE_URL}/sitemap.xml`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!text.includes("<urlset")) throw new Error("not a sitemap");
  });

  await check("Frontend: RSS /de/rss.xml", async () => {
    const { status, text } = await get(`${SITE_URL}/de/rss.xml`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!text.includes("<rss")) throw new Error("not RSS");
  });

  await check("Frontend: reserved slug /de/site-config is NOT exposed (404)", async () => {
    const { status } = await get(`${SITE_URL}/de/site-config`);
    if (status !== 404) throw new Error(`expected 404, got ${status}`);
  });

  // Derive an author slug from the post page if the API wasn't available.
  if (!authorSlug && firstSlug) {
    const { text } = await get(`${SITE_URL}/de/blog/${firstSlug}`);
    authorSlug = text.match(/\/de\/author\/([a-z0-9-]+)/i)?.[1] ?? null;
  }

  await check("Frontend: author page renders with Person JSON-LD", async () => {
    if (!authorSlug) throw new Error("no author slug available");
    const { status, text } = await get(`${SITE_URL}/de/author/${authorSlug}`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!text.includes('"Person"')) throw new Error("no Person schema");
    return `slug="${authorSlug}"`;
  });

  await check("Frontend: legacy /feed redirects to RSS", async () => {
    const res = await fetch(`${SITE_URL}/feed`, { redirect: "manual" });
    if (res.status < 300 || res.status >= 400)
      throw new Error(`expected 3xx, got ${res.status}`);
    const loc = res.headers.get("location") ?? "";
    if (!loc.includes("rss")) throw new Error(`unexpected location: ${loc}`);
  });

  if (commentsEnabled && commentsEnabled !== "off") {
    await check("Frontend: post page mounts comments (members enabled)", async () => {
      if (!firstSlug) throw new Error("no post slug");
      const { text } = await get(`${SITE_URL}/de/blog/${firstSlug}`);
      if (!text.includes('aria-label="Comments"'))
        throw new Error("comments section not rendered");
    });
  }

  await check("Frontend: post shows related posts", async () => {
    if (!firstSlug) throw new Error("no post slug");
    const { text } = await get(`${SITE_URL}/de/blog/${firstSlug}`);
    if (!text.includes("Ähnliche Beiträge"))
      throw new Error("related section not rendered");
  });

  await check("Frontend: contact endpoint validates input (400)", async () => {
    const res = await fetch(`${SITE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
  });

  await check("Frontend: preview endpoint is protected (401)", async () => {
    const res = await fetch(`${SITE_URL}/api/preview?slug=x`, { redirect: "manual" });
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  await check("Frontend: builder editor route loads", async () => {
    const { status } = await get(`${SITE_URL}/builder`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
  });

  await check("Frontend: builder API is protected (401)", async () => {
    const res = await fetch(`${SITE_URL}/api/builder/load?type=pages&slug=x`);
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  await check("Frontend: builder image upload is protected (401)", async () => {
    const res = await fetch(`${SITE_URL}/api/builder/upload`, { method: "POST" });
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  await check("Frontend: builder login rejects a wrong key (401)", async () => {
    const res = await fetch(`${SITE_URL}/api/builder/auth?key=definitely-wrong`, {
      redirect: "manual",
    });
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  await check("Frontend: posts API (dynamic blocks) returns a list", async () => {
    const { status, text } = await get(`${SITE_URL}/api/posts?lang=de&limit=1`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!Array.isArray(JSON.parse(text).posts)) throw new Error("no posts array");
  });

  await check("Frontend: builder revisions API is protected (401)", async () => {
    const res = await fetch(`${SITE_URL}/api/builder/revisions?type=pages&slug=x`);
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  // ---- Summary ----
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log(`FAILED: ${failed.map((f) => f.name).join("; ")}`);
    process.exit(1);
  }
  console.log("HEALTHCHECK OK");
}

main().catch((e) => {
  console.error("Healthcheck crashed:", e);
  process.exit(1);
});
