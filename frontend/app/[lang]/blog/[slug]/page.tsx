import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllPosts, getPostBySlug } from "@/lib/ghost/content";
import { abs } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const canonical = abs(`/${lang}/blog/${post.slug}`);
  return {
    title: post.title,
    description: post.custom_excerpt || post.excerpt || "",
    alternates: { canonical, languages: { "x-default": canonical } },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.custom_excerpt || post.excerpt || "",
      images: post.feature_image ? [post.feature_image] : undefined,
      publishedTime: post.published_at ?? undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const dict = await getDictionary(lang);
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString(lang, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: post.feature_image ? [post.feature_image] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    author: post.primary_author
      ? { "@type": "Person", name: post.primary_author.name }
      : undefined,
    mainEntityOfPage: abs(`/${lang}/blog/${post.slug}`),
    url: abs(`/${lang}/blog/${post.slug}`),
  };

  return (
    <article className="section">
      <JsonLd data={jsonLd} />
      <div className="container">
        <Link href={`/${lang}/blog`} className="muted" style={{ fontSize: "0.9rem" }}>
          ← {dict.blog.backToBlog}
        </Link>
        <h1 className="section-title" style={{ marginTop: "1rem", maxWidth: "20ch" }}>
          {post.title}
        </h1>
        {date && (
          <div className="post-meta">
            {dict.blog.publishedOn} {date}
          </div>
        )}
      </div>
      <div className="container" style={{ marginTop: "2.5rem" }}>
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: post.html ?? "" }}
        />
      </div>
    </article>
  );
}
