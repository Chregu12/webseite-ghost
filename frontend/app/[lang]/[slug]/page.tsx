import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/dictionaries";
import {
  getContentPages,
  getPageBySlug,
  isReservedPageSlug,
} from "@/lib/ghost/content";
import { contentMetadata } from "@/lib/ghost/meta";
import { extractPuckData } from "@/lib/builder";
import PuckRender from "@/components/PuckRender";

// Generic route for arbitrary Ghost pages (Impressum, Datenschutz, …).
// Static routes (blog, about, contact, search, tags, rss.xml) take precedence;
// this catches every other top-level slug. Reserved slugs (e.g. site-config)
// are guarded so the config JSON is never exposed publicly.
export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await getContentPages();
  return locales.flatMap((lang) => pages.map((page) => ({ lang, slug: page.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (isReservedPageSlug(slug)) return {};
  const page = await getPageBySlug(slug, "html");
  if (!page) return {};
  return contentMetadata(page, { lang, path: `/${slug}`, ogType: "website" });
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug } = await params;
  if (isReservedPageSlug(slug)) notFound();
  const page = await getPageBySlug(slug, "html,plaintext");
  if (!page) notFound();

  // If this page was built with the drag-and-drop builder, render that layout.
  const builder = extractPuckData(page.plaintext);
  if (builder) return <PuckRender data={builder} />;

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">{page.title}</h1>
        {page.html && (
          <div
            className="prose"
            style={{ marginTop: "2rem" }}
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        )}
      </div>
    </section>
  );
}
