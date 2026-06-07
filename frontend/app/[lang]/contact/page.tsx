import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { getPageBySlug } from "@/lib/ghost/content";
import { contentMetadata } from "@/lib/ghost/meta";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const slug = lang === "en" ? "contact-en" : "contact";
  const page = await getPageBySlug(slug, "html");
  if (!page) {
    const dict = await getDictionary(lang);
    return { title: dict.nav.contact };
  }
  return contentMetadata(page, { lang, path: "/contact", ogType: "website" });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  // Content-driven: edit the page (incl. an embedded form via HTML card) in
  // Ghost. Convention: DE slug "contact", EN slug "contact-en".
  const slug = lang === "en" ? "contact-en" : "contact";
  const page = await getPageBySlug(slug, "html");

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">{page?.title ?? dict.nav.contact}</h1>
        {page?.html ? (
          <div
            className="prose"
            style={{ marginTop: "2rem" }}
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        ) : (
          <p className="muted" style={{ marginTop: "1.5rem" }}>
            …
          </p>
        )}
      </div>
    </section>
  );
}
