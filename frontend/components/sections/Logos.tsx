import Image from "next/image";
import { getPostsByInternalTag } from "@/lib/ghost/content";
import type { SiteConfig } from "@/lib/ghost/config";

// Logo/skill strip — posts tagged #logo (feature image = logo, title = alt/label).
export default async function Logos({
  config,
  lang,
}: {
  config: SiteConfig;
  lang: string;
}) {
  const items = await getPostsByInternalTag("logo", lang);
  if (items.length === 0) return null;
  const { title } = config.content.logos;

  return (
    <section className="section" style={{ paddingBlock: "3rem" }}>
      <div className="container">
        {title && (
          <p
            className="muted"
            style={{ textAlign: "center", marginBottom: "1.5rem", fontSize: "0.9rem" }}
          >
            {title}
          </p>
        )}
        <div className="logo-strip">
          {items.map((item) =>
            item.feature_image ? (
              <Image
                key={item.id}
                src={item.feature_image}
                alt={item.feature_image_alt || item.title}
                width={120}
                height={40}
                style={{ height: "32px", width: "auto", objectFit: "contain" }}
              />
            ) : (
              <span key={item.id} className="muted">
                {item.title}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
