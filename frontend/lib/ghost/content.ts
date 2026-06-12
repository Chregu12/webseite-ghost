import type {
  GhostPost,
  GhostPage,
  GhostSettings,
  GhostTag,
  GhostAuthor,
  GhostPagination,
} from "./types";

// Internal (container-to-container) URL for server-side fetches.
const GHOST_URL = (process.env.GHOST_URL ?? "http://localhost:2368").replace(
  /\/$/,
  "",
);
const CONTENT_API = `${GHOST_URL}/ghost/api/content`;
const KEY = process.env.GHOST_CONTENT_API_KEY ?? "";
// Pinned Ghost API version. Bump deliberately (and run scripts/healthcheck.mjs)
// when upgrading to a new Ghost major — see docs/UPGRADE.md.
const API_VERSION = process.env.GHOST_API_VERSION ?? "v6.0";

// Ghost 6: maximum page size is 100 ("limit=all" was removed).
const MAX_LIMIT = 100;
// Cache fetched content for an hour; webhooks revalidate on demand by tag.
const DEFAULT_REVALIDATE = 3600;

/**
 * Low-level fetch against the Content API. Returns `null` on any failure so the
 * site stays buildable/renderable even when Ghost is unreachable.
 */
async function ghostFetch<T>(
  resource: string,
  params: Record<string, string | number | undefined> = {},
  cacheTags: string[] = [],
): Promise<{ data: T[]; pagination?: GhostPagination } | null> {
  if (!KEY) {
    // No API key configured yet (e.g. fresh install) — behave like "no content".
    return { data: [] };
  }
  const search = new URLSearchParams({ key: KEY });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  const url = `${CONTENT_API}/${resource}/?${search.toString()}`;
  try {
    const res = await fetch(url, {
      headers: { "Accept-Version": API_VERSION },
      next: { revalidate: DEFAULT_REVALIDATE, tags: ["ghost", ...cacheTags] },
    });
    if (!res.ok) {
      console.error(`[ghost] ${resource} -> HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as Record<string, unknown>;
    // The response key is the base resource ("posts", "pages", "tags"), even for
    // single-item endpoints like "posts/slug/<slug>".
    const responseKey = resource.split("/")[0];
    const data = (json[responseKey] as T[]) ?? [];
    const pagination = (json.meta as { pagination?: GhostPagination } | undefined)
      ?.pagination;
    return { data, pagination };
  } catch (err) {
    console.error(`[ghost] ${resource} fetch failed:`, err);
    return null;
  }
}

/**
 * Fetch every page of a browse endpoint, respecting Ghost 6's 100-item cap.
 */
async function fetchAllPaginated<T>(
  resource: string,
  params: Record<string, string | number | undefined> = {},
  cacheTags: string[] = [],
): Promise<T[]> {
  const first = await ghostFetch<T>(
    resource,
    { ...params, limit: MAX_LIMIT, page: 1 },
    cacheTags,
  );
  if (!first) return [];
  const all = [...first.data];
  const pages = first.pagination?.pages ?? 1;
  for (let page = 2; page <= pages; page++) {
    const next = await ghostFetch<T>(
      resource,
      { ...params, limit: MAX_LIMIT, page },
      cacheTags,
    );
    if (next) all.push(...next.data);
  }
  return all;
}

const POST_FIELDS_INCLUDE = { include: "tags,authors", formats: "html" };

// Internal tags used to drive homepage sections — these posts are NOT blog
// articles and must be excluded from blog listings, search, RSS and sitemap.
const SECTION_TAGS = ["feature", "logo", "showcase", "testimonial"];
const EXCLUDE_SECTIONS = SECTION_TAGS.map((t) => `tag:-hash-${t}`).join("+");

/** Blog-article filter: optional language tag, always excluding section posts. */
function blogFilter(lang?: string): string {
  const parts: string[] = [];
  if (lang) parts.push(`tag:hash-${lang}`);
  parts.push(EXCLUDE_SECTIONS);
  return parts.join("+");
}

/**
 * Latest posts. Filters by the language tag (#de / #en); if that yields nothing
 * (e.g. before content is tagged), falls back to unfiltered so the site still
 * shows the author's posts during early setup.
 */
export async function getPosts(opts: {
  lang?: string;
  limit?: number;
}): Promise<GhostPost[]> {
  const { lang, limit } = opts;
  const base = {
    ...POST_FIELDS_INCLUDE,
    order: "published_at desc",
    limit: limit ?? MAX_LIMIT,
  };
  const filtered = await ghostFetch<GhostPost>(
    "posts",
    { ...base, filter: blogFilter(lang) },
    ["posts"],
  );
  if (filtered && filtered.data.length > 0) return filtered.data;
  // Fallback (no language-tagged posts yet) — still exclude section posts.
  const fallback = await ghostFetch<GhostPost>(
    "posts",
    { ...base, filter: blogFilter() },
    ["posts"],
  );
  return fallback?.data ?? [];
}

/** All posts (paginated) for static generation / listings. */
export async function getAllPosts(lang?: string): Promise<GhostPost[]> {
  const filtered = await fetchAllPaginated<GhostPost>(
    "posts",
    { ...POST_FIELDS_INCLUDE, order: "published_at desc", filter: blogFilter(lang) },
    ["posts"],
  );
  if (filtered.length > 0) return filtered;
  return fetchAllPaginated<GhostPost>(
    "posts",
    { ...POST_FIELDS_INCLUDE, order: "published_at desc", filter: blogFilter() },
    ["posts"],
  );
}

/** Posts related to `post` by primary tag (falls back to latest), excluding it. */
export async function getRelatedPosts(
  post: GhostPost,
  lang?: string,
  limit = 3,
): Promise<GhostPost[]> {
  const tagSlug = post.primary_tag?.slug;
  if (tagSlug) {
    const parts = [`tag:${tagSlug}`, `id:-${post.id}`];
    if (lang) parts.push(`tag:hash-${lang}`);
    parts.push(EXCLUDE_SECTIONS);
    const related = await fetchAllPaginated<GhostPost>(
      "posts",
      { ...POST_FIELDS_INCLUDE, filter: parts.join("+"), order: "published_at desc" },
      ["posts"],
    );
    if (related.length) return related.slice(0, limit);
  }
  const latest = await getPosts({ lang, limit: limit + 1 });
  return latest.filter((p) => p.id !== post.id).slice(0, limit);
}

export async function getPostBySlug(slug: string): Promise<GhostPost | null> {
  const res = await ghostFetch<GhostPost>(
    `posts/slug/${encodeURIComponent(slug)}`,
    // plaintext too, so we can detect a builder (Puck) layout.
    { ...POST_FIELDS_INCLUDE, formats: "html,plaintext" },
    ["posts", `post:${slug}`],
  );
  return res?.data?.[0] ?? null;
}

export async function getPageBySlug(
  slug: string,
  formats: string = "html",
): Promise<GhostPage | null> {
  const res = await ghostFetch<GhostPage>(
    `pages/slug/${encodeURIComponent(slug)}`,
    { formats },
    ["pages", `page:${slug}`],
  );
  return res?.data?.[0] ?? null;
}

/** Repeatable section items selected by an internal tag, e.g. "feature". */
export async function getPostsByInternalTag(
  tag: string,
  lang?: string,
): Promise<GhostPost[]> {
  const filterParts = [`tag:hash-${tag}`];
  if (lang) filterParts.push(`tag:hash-${lang}`);
  return fetchAllPaginated<GhostPost>(
    "posts",
    { ...POST_FIELDS_INCLUDE, filter: filterParts.join("+"), order: "published_at asc" },
    ["posts", `tag:${tag}`],
  );
}

// Pages handled by dedicated routes or used internally — excluded from the
// generic /[lang]/[slug] page route and the sitemap.
const RESERVED_PAGE_SLUGS = new Set([
  "about",
  "about-en",
  "contact",
  "contact-en",
  "site-config",
  "site-config-en",
]);

export function isReservedPageSlug(slug: string): boolean {
  return RESERVED_PAGE_SLUGS.has(slug);
}

/** Public pages eligible for the generic page route (e.g. Impressum, Datenschutz). */
export async function getContentPages(): Promise<GhostPage[]> {
  const pages = await fetchAllPaginated<GhostPage>(
    "pages",
    { order: "published_at desc" },
    ["pages"],
  );
  return pages.filter((p) => !isReservedPageSlug(p.slug));
}

// ---- Authors ---------------------------------------------------------------

export async function getAuthors(): Promise<GhostAuthor[]> {
  return fetchAllPaginated<GhostAuthor>("authors", { include: "count.posts" }, ["authors"]);
}

export async function getAuthorBySlug(slug: string): Promise<GhostAuthor | null> {
  const res = await ghostFetch<GhostAuthor>(
    `authors/slug/${encodeURIComponent(slug)}`,
    { include: "count.posts" },
    ["authors", `author:${slug}`],
  );
  return res?.data?.[0] ?? null;
}

/** Blog posts by an author (excludes section posts). */
export async function getPostsByAuthor(
  slug: string,
  lang?: string,
): Promise<GhostPost[]> {
  const parts = [`author:${slug}`];
  if (lang) parts.push(`tag:hash-${lang}`);
  parts.push(EXCLUDE_SECTIONS);
  return fetchAllPaginated<GhostPost>(
    "posts",
    { ...POST_FIELDS_INCLUDE, filter: parts.join("+"), order: "published_at desc" },
    ["posts", `author:${slug}`],
  );
}

export async function getTags(): Promise<GhostTag[]> {
  return fetchAllPaginated<GhostTag>("tags", { include: "count.posts" }, ["tags"]);
}

/** Public, non-internal tags (for archives / sitemap). */
export async function getPublicTags(): Promise<GhostTag[]> {
  const tags = await getTags();
  return tags.filter((t) => t.visibility === "public" && !t.name.startsWith("#"));
}

export async function getTagBySlug(slug: string): Promise<GhostTag | null> {
  const res = await ghostFetch<GhostTag>(
    `tags/slug/${encodeURIComponent(slug)}`,
    { include: "count.posts" },
    ["tags", `tag:${slug}`],
  );
  return res?.data?.[0] ?? null;
}

/** Published posts carrying a public tag, optionally narrowed to a language. */
export async function getPostsByTag(slug: string, lang?: string): Promise<GhostPost[]> {
  const parts = [`tag:${slug}`];
  if (lang) parts.push(`tag:hash-${lang}`);
  const filtered = await fetchAllPaginated<GhostPost>(
    "posts",
    { ...POST_FIELDS_INCLUDE, filter: parts.join("+"), order: "published_at desc" },
    ["posts", `tag:${slug}`],
  );
  if (filtered.length > 0 || !lang) return filtered;
  return fetchAllPaginated<GhostPost>(
    "posts",
    { ...POST_FIELDS_INCLUDE, filter: `tag:${slug}`, order: "published_at desc" },
    ["posts", `tag:${slug}`],
  );
}

export async function getSettings(): Promise<GhostSettings | null> {
  // /settings/ is not array-wrapped; fetch raw.
  if (!KEY) return null;
  try {
    const res = await fetch(`${CONTENT_API}/settings/?key=${KEY}`, {
      headers: { "Accept-Version": API_VERSION },
      next: { revalidate: DEFAULT_REVALIDATE, tags: ["ghost", "settings"] },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { settings?: GhostSettings };
    return json.settings ?? null;
  } catch (err) {
    console.error("[ghost] settings fetch failed:", err);
    return null;
  }
}

export { GHOST_URL, MAX_LIMIT };
