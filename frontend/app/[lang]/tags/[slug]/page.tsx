import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { locales } from "@/i18n/dictionaries";
import { getPublicTags, getPostsByTag, getTagBySlug } from "@/lib/ghost/content";
import PostCard from "@/components/blog/PostCard";

export const revalidate = 3600;

export async function generateStaticParams() {
  const tags = await getPublicTags();
  return locales.flatMap((lang) => tags.map((tag) => ({ lang, slug: tag.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return {};
  return {
    title: tag.name,
    description: tag.description ?? undefined,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const dict = await getDictionary(lang);
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const posts = await getPostsByTag(slug, lang);

  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">#{tag.name}</span>
        <h1 className="section-title" style={{ marginTop: "1rem" }}>
          {tag.name}
        </h1>
        {tag.description && (
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            {tag.description}
          </p>
        )}
        {posts.length === 0 ? (
          <p className="muted" style={{ marginTop: "1.5rem" }}>
            {dict.blog.empty}
          </p>
        ) : (
          <div className="grid grid-3" style={{ marginTop: "2.5rem" }}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
