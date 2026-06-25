#!/usr/bin/env node
// MCP server exposing the Ghost CMS to AI agents (read + write) over stdio.
//
// Configure in an MCP client (e.g. Claude Desktop/Code) with env:
//   GHOST_URL=https://cms.example.com
//   GHOST_ADMIN_API_KEY=<id>:<secret>   (from a Ghost custom integration)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  assertConfigured,
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  listPages,
  getPage,
  createPage,
  updatePage,
  listTags,
  getSettings,
  getSiteConfig,
  updateSiteConfig,
  GHOST_URL,
} from "./ghost.js";

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function fail(err: unknown): ToolResult {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}
const wrap =
  <T>(fn: (args: T) => Promise<unknown>) =>
  async (args: T): Promise<ToolResult> => {
    try {
      return ok(await fn(args));
    } catch (e) {
      return fail(e);
    }
  };

const server = new McpServer({ name: "webseite-ghost-mcp", version: "0.1.0" });

// ---- Posts -----------------------------------------------------------------

server.tool(
  "ghost_list_posts",
  "List posts (newest first). Optional Ghost filter (e.g. 'tag:hash-de', 'status:draft'), limit (max 100) and page.",
  {
    query: z.string().optional().describe("Ghost filter expression"),
    limit: z.number().int().min(1).max(100).optional(),
    page: z.number().int().min(1).optional(),
  },
  wrap(listPosts),
);

server.tool(
  "ghost_get_post",
  "Get a single post by id or slug (includes html, tags, authors, SEO meta).",
  { id: z.string().optional(), slug: z.string().optional() },
  wrap(getPost),
);

server.tool(
  "ghost_create_post",
  "Create a blog post. Provide html for the body. status defaults to 'draft'. Use lang ('de'|'en') to add the language tag, and tags for additional/internal tags (prefix with # for internal).",
  {
    title: z.string(),
    html: z.string().optional(),
    custom_excerpt: z.string().optional(),
    status: z.enum(["draft", "published", "scheduled"]).optional(),
    tags: z.array(z.string()).optional(),
    feature_image: z.string().optional(),
    lang: z.enum(["de", "en"]).optional(),
  },
  wrap(createPost),
);

server.tool(
  "ghost_update_post",
  "Update a post by id. Pass only the fields to change (title, html, custom_excerpt, status, feature_image, meta_title, meta_description, tags, lang). updated_at is handled automatically.",
  {
    id: z.string(),
    title: z.string().optional(),
    html: z.string().optional(),
    custom_excerpt: z.string().optional(),
    status: z.enum(["draft", "published", "scheduled"]).optional(),
    feature_image: z.string().optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lang: z.enum(["de", "en"]).optional(),
  },
  wrap(({ id, ...fields }) => updatePost(id, fields)),
);

server.tool(
  "ghost_delete_post",
  "Permanently delete a post by id.",
  { id: z.string() },
  wrap(({ id }) => deletePost(id)),
);

// ---- Pages -----------------------------------------------------------------

server.tool(
  "ghost_list_pages",
  "List pages (About, Impressum, site-config, …).",
  { limit: z.number().int().min(1).max(100).optional(), page: z.number().int().min(1).optional() },
  wrap(listPages),
);

server.tool(
  "ghost_get_page",
  "Get a page by slug (includes html and plaintext).",
  { slug: z.string() },
  wrap(({ slug }) => getPage(slug)),
);

server.tool(
  "ghost_create_page",
  "Create a page (e.g. Impressum/Datenschutz). status defaults to 'published'.",
  {
    title: z.string(),
    slug: z.string().optional(),
    html: z.string().optional(),
    status: z.enum(["draft", "published"]).optional(),
  },
  wrap(createPage),
);

server.tool(
  "ghost_update_page",
  "Update a page by id. Pass only the fields to change. updated_at handled automatically.",
  {
    id: z.string(),
    title: z.string().optional(),
    slug: z.string().optional(),
    html: z.string().optional(),
    status: z.enum(["draft", "published"]).optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
  },
  wrap(({ id, ...fields }) => updatePage(id, fields)),
);

// ---- Tags, settings, site-config ------------------------------------------

server.tool("ghost_list_tags", "List all tags with post counts.", {}, wrap(() => listTags()));

server.tool(
  "ghost_get_settings",
  "Get site settings (title, description, navigation, accent color, icon, …).",
  {},
  wrap(() => getSettings()),
);

server.tool(
  "ghost_get_site_config",
  "Read the homepage site-config (hero text, section toggles, footer/social) as JSON. lang: 'de' (default) or 'en'.",
  { lang: z.enum(["de", "en"]).optional() },
  wrap(({ lang }) => getSiteConfig(lang)),
);

server.tool(
  "ghost_update_site_config",
  "Replace the homepage site-config JSON (hero, sections, content, footer). lang: 'de' (default) or 'en'. Pass the FULL config object.",
  { lang: z.enum(["de", "en"]).optional(), config: z.record(z.any()) },
  wrap(({ lang, config }) => updateSiteConfig(lang, config)),
);

async function main() {
  assertConfigured();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr (stdout is the MCP channel).
  console.error(`webseite-ghost-mcp connected to ${GHOST_URL}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
