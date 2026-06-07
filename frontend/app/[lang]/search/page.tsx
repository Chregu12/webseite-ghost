import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllPosts } from "@/lib/ghost/content";
import SearchClient, { type SearchItem } from "@/components/SearchClient";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return { title: dict.search.title, robots: { index: false } };
}

export default async function SearchPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const posts = await getAllPosts(lang);

  // Lightweight client-side index — fine for a personal blog's volume.
  const items: SearchItem[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.custom_excerpt || post.excerpt || "",
    tags: (post.tags ?? [])
      .filter((t) => t.visibility === "public" && !t.name.startsWith("#"))
      .map((t) => t.name),
  }));

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">{dict.search.title}</h1>
        <SearchClient
          items={items}
          lang={lang}
          placeholder={dict.search.placeholder}
          noResults={dict.search.noResults}
        />
      </div>
    </section>
  );
}
