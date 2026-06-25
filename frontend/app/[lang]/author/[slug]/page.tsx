import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary, locales } from "@/i18n/dictionaries";
import {
  getAuthors,
  getAuthorBySlug,
  getPostsByAuthor,
} from "@/lib/ghost/content";
import { abs } from "@/lib/site";
import { personLd } from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/blog/PostCard";

export const revalidate = 3600;

export async function generateStaticParams() {
  const authors = await getAuthors();
  return locales.flatMap((lang) => authors.map((a) => ({ lang, slug: a.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};
  const canonical = abs(`/${lang}/author/${author.slug}`);
  return {
    title: author.name,
    description: author.bio ?? undefined,
    alternates: {
      canonical,
      languages: {
        de: abs(`/de/author/${author.slug}`),
        en: abs(`/en/author/${author.slug}`),
        "x-default": abs(`/de/author/${author.slug}`),
      },
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const dict = await getDictionary(lang);
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();
  const posts = await getPostsByAuthor(slug, lang);
  const url = abs(`/${lang}/author/${author.slug}`);

  return (
    <section className="section">
      <JsonLd data={personLd(author, { url })} />
      <div className="container">
        <div className="author-header">
          {author.profile_image && (
            <Image
              src={author.profile_image}
              alt={author.name}
              width={80}
              height={80}
              style={{ borderRadius: "999px" }}
            />
          )}
          <div>
            <h1 className="section-title">{author.name}</h1>
            {author.bio && (
              <p className="muted" style={{ marginTop: "0.5rem" }}>
                {author.bio}
              </p>
            )}
          </div>
        </div>

        <h2 className="muted" style={{ marginTop: "2.5rem", fontSize: "1rem" }}>
          {dict.blog.postsBy} {author.name}
        </h2>
        {posts.length === 0 ? (
          <p className="muted" style={{ marginTop: "1rem" }}>
            {dict.blog.empty}
          </p>
        ) : (
          <div className="grid grid-3" style={{ marginTop: "1.5rem" }}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
