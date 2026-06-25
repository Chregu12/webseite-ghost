import Image from "next/image";
import Link from "next/link";
import { getPostsByInternalTag } from "@/lib/ghost/content";
import type { SiteConfig } from "@/lib/ghost/config";
import SectionHeader from "./SectionHeader";

// Feature cards are edited in Ghost as posts with the internal tag #feature.
export default async function Features({
  config,
  lang,
}: {
  config: SiteConfig;
  lang: string;
}) {
  const items = await getPostsByInternalTag("feature", lang);
  if (items.length === 0) return null;
  const { title, intro } = config.content.features;

  return (
    <section className="section">
      <div className="container">
        <SectionHeader title={title} intro={intro} />
        <div className="grid grid-3" style={{ marginTop: "2.5rem" }}>
          {items.map((item) => {
            const body = (
              <>
                {item.feature_image && (
                  <Image
                    src={item.feature_image}
                    alt={item.feature_image_alt || item.title}
                    width={80}
                    height={80}
                    style={{ borderRadius: "12px", marginBottom: "1rem" }}
                  />
                )}
                <h3>{item.title}</h3>
                {(item.custom_excerpt || item.excerpt) && (
                  <p className="muted" style={{ marginTop: "0.5rem" }}>
                    {item.custom_excerpt || item.excerpt}
                  </p>
                )}
              </>
            );
            // A feature may optionally link to its own post.
            return item.slug ? (
              <Link key={item.id} href={`/${lang}/blog/${item.slug}`} className="card">
                {body}
              </Link>
            ) : (
              <div key={item.id} className="card">
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
