import { SITE_URL } from "@/lib/site";
import {
  getSettings,
  getAllPosts,
  getContentPages,
} from "@/lib/ghost/content";

// llms.txt (https://llmstxt.org) — a curated, machine-readable overview of the
// site for LLMs / AI search engines: title, description, key pages and posts
// with links and one-line summaries.
export const revalidate = 3600;

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export async function GET() {
  const [settings, posts, pages] = await Promise.all([
    getSettings(),
    getAllPosts("de"),
    getContentPages(),
  ]);

  const title = settings?.title ?? "Website";
  const description = settings?.description ?? "";

  const lines: string[] = [`# ${title}`, ""];
  if (description) lines.push(`> ${description}`, "");
  lines.push(
    "Available in German (`/de`) and English (`/en`). Links below use the German paths.",
    "",
    "## Pages",
    "",
    `- [About](${SITE_URL}/de/about)`,
    `- [Contact](${SITE_URL}/de/contact)`,
  );
  for (const page of pages) {
    lines.push(`- [${page.title}](${SITE_URL}/de/${page.slug})`);
  }

  lines.push("", "## Blog posts", "");
  for (const post of posts) {
    const excerpt = oneLine(post.custom_excerpt || post.excerpt || "");
    lines.push(
      `- [${post.title}](${SITE_URL}/de/blog/${post.slug})${excerpt ? `: ${excerpt}` : ""}`,
    );
  }

  lines.push(
    "",
    "## Feeds",
    "",
    `- [RSS (DE)](${SITE_URL}/de/rss.xml)`,
    `- [RSS (EN)](${SITE_URL}/en/rss.xml)`,
    `- [Sitemap](${SITE_URL}/sitemap.xml)`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
