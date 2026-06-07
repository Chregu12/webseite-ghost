import type {
  GhostPost,
  GhostPage,
  GhostSettings,
  GhostTag,
  GhostPagination,
} from "./types";

// Internal (container-to-container) URL for server-side fetches.
const GHOST_URL = (process.env.GHOST_URL ?? "http://localhost:2368").replace(
  /\/$/,
  "",
);
const CONTENT_API = `${GHOST_URL}/ghost/api/content`;
const KEY = process.env.GHOST_CONTENT_API_KEY ?? "";

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
      headers: { "Accept-Version": "v6.0" },
      next: { revalidate: DEFAULT_REVALIDATE, tags: ["ghost", ...cacheTags] },
    });
    if (!res.ok) {
      console.error(`[ghost] ${resource} -> HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as Record<string, unknown>;
    const data = (json[resource] as T[]) ?? [];
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

/** Build an internal-tag filter for a language (e.g. tag:hash-de). */
function langFilter(lang?: string): string | undefined {
  return lang ? `tag:hash-${lang}` : undefined;
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
    { ...base, filter: langFilter(lang) },
    ["posts"],
  );
  if (filtered && filtered.data.length > 0) return filtered.data;
  const fallback = await ghostFetch<GhostPost>("posts", base, ["posts"]);
  return fallback?.data ?? [];
}

/** All posts (paginated) for static generation / listings. */
export async function getAllPosts(lang?: string): Promise<GhostPost[]> {
  const filtered = await fetchAllPaginated<GhostPost>(
    "posts",
    { ...POST_FIELDS_INCLUDE, order: "published_at desc", filter: langFilter(lang) },
    ["posts"],
  );
  if (filtered.length > 0) return filtered;
  return fetchAllPaginated<GhostPost>(
    "posts",
    { ...POST_FIELDS_INCLUDE, order: "published_at desc" },
    ["posts"],
  );
}

export async function getPostBySlug(slug: string): Promise<GhostPost | null> {
  const res = await ghostFetch<GhostPost>(
    `posts/slug/${encodeURIComponent(slug)}`,
    POST_FIELDS_INCLUDE,
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

export async function getTags(): Promise<GhostTag[]> {
  return fetchAllPaginated<GhostTag>("tags", { include: "count.posts" }, ["tags"]);
}

export async function getSettings(): Promise<GhostSettings | null> {
  // /settings/ is not array-wrapped; fetch raw.
  if (!KEY) return null;
  try {
    const res = await fetch(`${CONTENT_API}/settings/?key=${KEY}`, {
      headers: { "Accept-Version": "v6.0" },
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
