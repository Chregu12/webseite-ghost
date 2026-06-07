import { getDictionary } from "@/i18n/dictionaries";
import { getPageBySlug } from "@/lib/ghost/content";

export const revalidate = 3600;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  // Convention: DE page slug "about", EN page slug "about-en".
  const slug = lang === "en" ? "about-en" : "about";
  const page = await getPageBySlug(slug, "html");

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">{page?.title ?? dict.nav.about}</h1>
        {page?.html ? (
          <div
            className="prose"
            style={{ marginTop: "2rem" }}
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        ) : (
          <p className="muted" style={{ marginTop: "1.5rem" }}>
            {/* Shown until an "about" page is created in Ghost. */}
            …
          </p>
        )}
      </div>
    </section>
  );
}
