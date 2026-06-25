import { SITE_URL } from "@/lib/site";
import { getSettings, getAllPosts } from "@/lib/ghost/content";
import { htmlToText } from "@/lib/text";

// llms-full.txt — the full text of the blog content in one document, so AI /
// generative engines can ingest it cleanly (companion to /llms.txt).
export const revalidate = 3600;

export async function GET() {
  const [settings, posts] = await Promise.all([getSettings(), getAllPosts("de")]);

  const lines: string[] = [`# ${settings?.title ?? "Website"} — Volltext`, ""];
  if (settings?.description) lines.push(`> ${settings.description}`, "");

  for (const post of posts) {
    lines.push(`## ${post.title}`);
    lines.push(`URL: ${SITE_URL}/de/blog/${post.slug}`, "");
    const text = htmlToText(post.html);
    if (text) lines.push(text, "");
    lines.push("---", "");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
