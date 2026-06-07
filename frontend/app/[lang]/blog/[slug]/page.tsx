import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllPosts, getPostBySlug, getSettings } from "@/lib/ghost/content";
import { locales } from "@/i18n/dictionaries";
import { abs } from "@/lib/site";
import { contentMetadata } from "@/lib/ghost/meta";
import { blogPostingLd, breadcrumbLd } from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return locales.flatMap((lang) =>
    posts.map((post) => ({ lang, slug: post.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return contentMetadata(post, {
    lang,
    path: `/blog/${post.slug}`,
    ogType: "article",
    publishedTime: post.published_at,
  });
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
  const settings = await getSettings();
  const siteName = settings?.title ?? "Mein Blog";

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString(lang, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const articleLd = blogPostingLd(post, { lang, siteName, logo: settings?.logo });
  const crumbsLd = breadcrumbLd([
    { name: siteName, url: abs(`/${lang}`) },
    { name: dict.blog.title, url: abs(`/${lang}/blog`) },
    { name: post.title, url: abs(`/${lang}/blog/${post.slug}`) },
  ]);

  return (
    <article className="section">
      <JsonLd data={articleLd} />
      <JsonLd data={crumbsLd} />
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
