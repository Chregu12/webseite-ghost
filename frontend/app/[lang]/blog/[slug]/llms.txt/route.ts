import { getPostBySlug } from "@/lib/ghost/content";
import { htmlToText } from "@/lib/text";

// Per-post clean text/markdown for AI ingestion (linked from the post head).
export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string; slug: string }> },
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return new Response("Not found", { status: 404 });

  const body = post.plaintext || htmlToText(post.html);
  const md = `# ${post.title}\n\n${body}\n`;
  return new Response(md, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
