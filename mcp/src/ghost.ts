// Ghost Admin API client for the MCP server. Authenticates with a short-lived
// JWT derived from the Admin API key (id:secret), no external deps.
import crypto from "node:crypto";

const GHOST_URL = (process.env.GHOST_URL ?? "http://localhost:2368").replace(/\/$/, "");
const ADMIN_KEY = process.env.GHOST_ADMIN_API_KEY ?? "";
const API = `${GHOST_URL}/ghost/api/admin`;

export function assertConfigured(): void {
  if (!ADMIN_KEY.includes(":")) {
    throw new Error(
      "GHOST_ADMIN_API_KEY must be set to '<id>:<secret>' (from a Ghost custom integration).",
    );
  }
}

function token(): string {
  assertConfigured();
  const [id, secret] = ADMIN_KEY.split(":");
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
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

async function adminFetch(
  path: string,
  init: RequestInit = {},
): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Ghost ${token()}`,
      "Content-Type": "application/json",
      "Accept-Version": "v6.0",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = json?.errors?.[0]?.message ?? res.statusText;
    throw new Error(`Ghost API ${res.status}: ${msg}`);
  }
  return json;
}

const POST_FIELDS = "include=tags,authors&formats=html";

// ---- Posts -----------------------------------------------------------------

export async function listPosts(opts: {
  query?: string;
  limit?: number;
  page?: number;
}) {
  const sp = new URLSearchParams({
    limit: String(opts.limit ?? 15),
    page: String(opts.page ?? 1),
    order: "updated_at desc",
  });
  if (opts.query) sp.set("filter", opts.query);
  const json = await adminFetch(`/posts/?${sp}&${POST_FIELDS}`);
  return json.posts;
}

export async function getPost(opts: { id?: string; slug?: string }) {
  if (opts.id) return (await adminFetch(`/posts/${opts.id}/?${POST_FIELDS}`)).posts?.[0];
  if (opts.slug)
    return (await adminFetch(`/posts/slug/${encodeURIComponent(opts.slug)}/?${POST_FIELDS}`))
      .posts?.[0];
  throw new Error("Provide id or slug.");
}

function buildTags(tags?: string[], lang?: string) {
  const list = (tags ?? []).map((name) => ({ name }));
  if (lang) list.push({ name: `#${lang}` });
  return list.length ? list : undefined;
}

export async function createPost(data: {
  title: string;
  html?: string;
  custom_excerpt?: string;
  status?: string;
  tags?: string[];
  feature_image?: string;
  lang?: string;
}) {
  const { tags, lang, ...rest } = data;
  const body = {
    posts: [{ ...rest, status: rest.status ?? "draft", tags: buildTags(tags, lang) }],
  };
  const json = await adminFetch(`/posts/?source=html`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return json.posts?.[0];
}

export async function updatePost(id: string, fields: Record<string, unknown>) {
  const current = await adminFetch(`/posts/${id}/?fields=id,updated_at`);
  const updated_at = current.posts?.[0]?.updated_at;
  const { tags, lang, ...rest } = fields as any;
  const patch: Record<string, unknown> = { ...rest, updated_at };
  if (tags || lang) patch.tags = buildTags(tags, lang);
  const json = await adminFetch(`/posts/${id}/?source=html`, {
    method: "PUT",
    body: JSON.stringify({ posts: [patch] }),
  });
  return json.posts?.[0];
}

export async function deletePost(id: string) {
  await adminFetch(`/posts/${id}/`, { method: "DELETE" });
  return { deleted: id };
}

// ---- Pages -----------------------------------------------------------------

export async function listPages(opts: { limit?: number; page?: number }) {
  const sp = new URLSearchParams({
    limit: String(opts.limit ?? 15),
    page: String(opts.page ?? 1),
    order: "updated_at desc",
  });
  return (await adminFetch(`/pages/?${sp}&formats=html`)).pages;
}

export async function getPage(slug: string) {
  return (await adminFetch(`/pages/slug/${encodeURIComponent(slug)}/?formats=html,plaintext`))
    .pages?.[0];
}

export async function createPage(data: {
  title: string;
  slug?: string;
  html?: string;
  status?: string;
}) {
  const json = await adminFetch(`/pages/?source=html`, {
    method: "POST",
    body: JSON.stringify({ pages: [{ status: "published", ...data }] }),
  });
  return json.pages?.[0];
}

export async function updatePage(id: string, fields: Record<string, unknown>) {
  const current = await adminFetch(`/pages/${id}/?fields=id,updated_at`);
  const updated_at = current.pages?.[0]?.updated_at;
  const json = await adminFetch(`/pages/${id}/?source=html`, {
    method: "PUT",
    body: JSON.stringify({ pages: [{ ...fields, updated_at }] }),
  });
  return json.pages?.[0];
}

// ---- Tags & settings -------------------------------------------------------

export async function listTags() {
  return (await adminFetch(`/tags/?limit=100&include=count.posts`)).tags;
}

export async function getSettings() {
  const json = await adminFetch(`/settings/`);
  // Admin settings come back as [{key,value}, …]; flatten to an object.
  const out: Record<string, unknown> = {};
  for (const s of json.settings ?? []) out[s.key] = s.value;
  return out;
}

// ---- Site config (the JSON page that drives the homepage) ------------------

const configSlug = (lang?: string) => (lang === "en" ? "site-config-en" : "site-config");

export async function getSiteConfig(lang?: string) {
  const page = await getPage(configSlug(lang));
  if (!page) return null;
  const raw = (page.plaintext ?? "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return { _raw: raw };
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return { _raw: raw, _error: "invalid JSON" };
  }
}

export async function updateSiteConfig(lang: string | undefined, config: unknown) {
  const slug = configSlug(lang);
  const html = `<pre><code>${JSON.stringify(config, null, 2)}</code></pre>`;
  const existing = await getPage(slug);
  if (existing) {
    return updatePage(existing.id, { html });
  }
  return createPage({ title: slug, slug, html, status: "published" });
}

export { GHOST_URL };
