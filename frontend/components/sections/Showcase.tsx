import Image from "next/image";
import { getPostsByInternalTag } from "@/lib/ghost/content";
import type { SiteConfig } from "@/lib/ghost/config";
import SectionHeader from "./SectionHeader";

// Alternating text / visual blocks — posts tagged #showcase.
export default async function Showcase({
  config,
  lang,
}: {
  config: SiteConfig;
  lang: string;
}) {
  const items = await getPostsByInternalTag("showcase", lang);
  if (items.length === 0) return null;
  const { title, intro } = config.content.showcase;

  return (
    <section className="section">
      <div className="container">
        <SectionHeader title={title} intro={intro} />
        <div style={{ marginTop: "3rem", display: "grid", gap: "4rem" }}>
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`showcase-row${i % 2 === 1 ? " reverse" : ""}`}
            >
              <div className="showcase-text">
                <h3 style={{ fontSize: "1.6rem" }}>{item.title}</h3>
                {(item.custom_excerpt || item.excerpt) && (
                  <p className="muted" style={{ marginTop: "0.75rem" }}>
                    {item.custom_excerpt || item.excerpt}
                  </p>
                )}
              </div>
              {item.feature_image && (
                <div className="showcase-visual">
                  <Image
                    src={item.feature_image}
                    alt={item.feature_image_alt || item.title}
                    width={560}
                    height={360}
                    style={{ width: "100%", height: "auto", borderRadius: "var(--radius)" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
