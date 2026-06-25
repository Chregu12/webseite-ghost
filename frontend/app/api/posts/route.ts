import { NextResponse } from "next/server";
import { getPosts, getPostsByTag } from "@/lib/ghost/content";

// Public posts endpoint for the builder's dynamic "Latest posts" block.
export const revalidate = 3600;

export async function GET(request: Request) {
  const u = new URL(request.url);
  const lang = u.searchParams.get("lang") || "de";
  const tag = u.searchParams.get("tag") || "";
  const limit = Math.min(Math.max(Number(u.searchParams.get("limit") || 3), 1), 12);

  const raw = tag ? await getPostsByTag(tag, lang) : await getPosts({ lang, limit });
  const posts = raw.slice(0, limit).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.custom_excerpt || p.excerpt || "",
    feature_image: p.feature_image,
    date: p.published_at
      ? new Date(p.published_at).toLocaleDateString(lang, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "",
  }));

  return NextResponse.json({ posts });
}
