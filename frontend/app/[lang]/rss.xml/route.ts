import { SITE_URL } from "@/lib/site";
import { locales } from "@/i18n/dictionaries";
import { getAllPosts, getSettings } from "@/lib/ghost/content";

export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;
  const settings = await getSettings();
  const posts = await getAllPosts(lang);

  const title = settings?.title ?? "Blog";
  const description = settings?.description ?? "";

  const items = posts
    .map(
      (post) => `    <item>
      <title>${esc(post.title)}</title>
      <link>${SITE_URL}/${lang}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/${lang}/blog/${post.slug}</guid>${
        post.published_at
          ? `\n      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>`
          : ""
      }
      <description>${esc(post.custom_excerpt || post.excerpt || "")}</description>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(title)}</title>
    <link>${SITE_URL}/${lang}</link>
    <atom:link href="${SITE_URL}/${lang}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(description)}</description>
    <language>${lang}</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
