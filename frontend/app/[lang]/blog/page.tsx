import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllPosts } from "@/lib/ghost/content";
import PostCard from "@/components/blog/PostCard";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return { title: dict.blog.title };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const posts = await getAllPosts(lang);

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">{dict.blog.title}</h1>
        {posts.length === 0 ? (
          <p className="muted" style={{ marginTop: "1.5rem" }}>
            {dict.blog.empty}
          </p>
        ) : (
          <div className="grid grid-3" style={{ marginTop: "2rem" }}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
