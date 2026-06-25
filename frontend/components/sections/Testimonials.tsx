import Image from "next/image";
import { getPostsByInternalTag } from "@/lib/ghost/content";
import type { SiteConfig } from "@/lib/ghost/config";
import SectionHeader from "./SectionHeader";

// Quotes — posts tagged #testimonial.
// title = quote, excerpt = person/role, feature_image = avatar.
export default async function Testimonials({
  config,
  lang,
}: {
  config: SiteConfig;
  lang: string;
}) {
  const items = await getPostsByInternalTag("testimonial", lang);
  if (items.length === 0) return null;
  const { title, intro } = config.content.testimonials;

  return (
    <section className="section">
      <div className="container">
        <SectionHeader title={title} intro={intro} />
        <div className="grid grid-3" style={{ marginTop: "2.5rem" }}>
          {items.map((item) => (
            <figure key={item.id} className="card" style={{ margin: 0 }}>
              <blockquote style={{ margin: 0, fontSize: "1.05rem" }}>
                “{item.title}”
              </blockquote>
              <figcaption
                style={{
                  marginTop: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                {item.feature_image && (
                  <Image
                    src={item.feature_image}
                    alt=""
                    width={40}
                    height={40}
                    style={{ borderRadius: "999px" }}
                  />
                )}
                <span className="muted" style={{ fontSize: "0.9rem" }}>
                  {item.custom_excerpt || item.excerpt}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
