import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getAllPosts,
  getPostBySlug,
  getSettings,
  getRelatedPosts,
} from "@/lib/ghost/content";
import { getPostBySlugAdmin } from "@/lib/ghost/admin";
import { getSiteConfig } from "@/lib/ghost/config";
import { locales } from "@/i18n/dictionaries";
import { abs } from "@/lib/site";
import { contentMetadata } from "@/lib/ghost/meta";
import { blogPostingLd, breadcrumbLd } from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";
import Comments from "@/components/Comments";
import RelatedPosts from "@/components/sections/RelatedPosts";

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
  const { isEnabled: isPreview } = await draftMode();
  const post = isPreview ? await getPostBySlugAdmin(slug) : await getPostBySlug(slug);
  if (!post) notFound();
  const settings = await getSettings();
  const config = await getSiteConfig(lang);
  const siteName = settings?.title ?? "Mein Blog";
  const author = post.primary_author;
  const related = await getRelatedPosts(post, lang, 3);

  const ghostPublicUrl = (
    process.env.GHOST_PUBLIC_URL ??
    process.env.GHOST_URL ??
    "http://localhost:2368"
  ).replace(/\/$/, "");
  const commentsUrl =
    process.env.GHOST_COMMENTS_UI_URL ??
    "https://cdn.jsdelivr.net/ghost/comments-ui@latest/umd/comments-ui.min.js";
  const showComments =
    config.sections.comments &&
    settings?.comments_enabled !== "off" &&
    !!process.env.GHOST_CONTENT_API_KEY;

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
    <>
      {isPreview && (
        <div className="preview-banner">
          {dict.preview.banner}
          <a href={`/api/preview/disable?lang=${lang}`}>{dict.preview.exit}</a>
        </div>
      )}
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
        <div className="post-meta">
          {author && (
            <>
              {dict.blog.by}{" "}
              <Link href={`/${lang}/author/${author.slug}`} className="post-author-link">
                {author.name}
              </Link>
              {date ? " · " : ""}
            </>
          )}
          {date && `${dict.blog.publishedOn} ${date}`}
        </div>
      </div>
      <div className="container" style={{ marginTop: "2.5rem" }}>
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: post.html ?? "" }}
        />
      </div>
      {related.length > 0 && (
        <RelatedPosts posts={related} lang={lang} title={dict.blog.related} />
      )}
      {showComments && (
        <Comments
          ghostUrl={ghostPublicUrl}
          apiKey={process.env.GHOST_CONTENT_API_KEY ?? ""}
          postId={post.id}
          title={post.title}
          scriptUrl={commentsUrl}
        />
      )}
      </article>
    </>
  );
}
