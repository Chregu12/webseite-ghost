import type { Config } from "@measured/puck";
import ImageField from "@/components/builder/ImageField";
import LatestPostsBlock from "@/components/builder/blocks/LatestPostsBlock";

// Reusable image field with upload-to-Ghost support.
const imageField = {
  type: "custom" as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: ({ value, onChange }: any) => (
    <ImageField value={value} onChange={onChange} />
  ),
};

// Puck drag-and-drop config. Each component is a draggable block. "slot" fields
// give real nested layout (columns/sections) — true drag-and-drop, not just a
// fixed list. Blocks reuse the site's design tokens/classes from globals.css.

type Align = "left" | "center" | "right";

export type Props = {
  Heading: { text: string; level: "h1" | "h2" | "h3"; align: Align };
  Text: { text: string; align: Align; muted: boolean };
  ImageBlock: { src: string; alt: string; rounded: boolean; maxWidth: string };
  Button: { label: string; href: string; variant: "primary" | "secondary" | "ghost" };
  Spacer: { size: "s" | "m" | "l" | "xl" };
  Divider: Record<string, never>;
  Columns: { count: "2" | "3"; gap: string };
  Section: { padded: boolean; surface: boolean };
  Hero: {
    eyebrow: string;
    headline: string;
    subtitle: string;
    ctaPrimaryLabel: string;
    ctaPrimaryUrl: string;
    ctaSecondaryLabel: string;
    ctaSecondaryUrl: string;
    rings: boolean;
  };
  CtaBand: { title: string; text: string; buttonLabel: string; buttonUrl: string };
};

const alignField = {
  type: "select" as const,
  options: [
    { label: "Links", value: "left" },
    { label: "Mitte", value: "center" },
    { label: "Rechts", value: "right" },
  ],
};

// Typed loosely (Config, not Config<Props>) so slot fields for nested layout
// are accepted; Props above documents the block props.
export const config: Config = {
  components: {
    Hero: {
      label: "Hero",
      fields: {
        eyebrow: { type: "text" },
        headline: { type: "text" },
        subtitle: { type: "textarea" },
        ctaPrimaryLabel: { type: "text" },
        ctaPrimaryUrl: { type: "text" },
        ctaSecondaryLabel: { type: "text" },
        ctaSecondaryUrl: { type: "text" },
        rings: {
          type: "radio",
          options: [
            { label: "Ringe an", value: true },
            { label: "Ringe aus", value: false },
          ],
        },
      },
      defaultProps: {
        eyebrow: "Persönlicher Blog",
        headline: "Ich baue Dinge mit Code & KI",
        subtitle: "Gedanken, Projekte und Experimente.",
        ctaPrimaryLabel: "Blog lesen",
        ctaPrimaryUrl: "/de/blog",
        ctaSecondaryLabel: "Über mich",
        ctaSecondaryUrl: "/de/about",
        rings: true,
      },
      render: ({
        eyebrow,
        headline,
        subtitle,
        ctaPrimaryLabel,
        ctaPrimaryUrl,
        ctaSecondaryLabel,
        ctaSecondaryUrl,
        rings,
      }) => (
        <section className="hero">
          {rings && (
            <div className="hero-rings" aria-hidden="true">
              <span className="ring" />
              <span className="ring" />
              <span className="ring" />
              <span className="ring" />
              <span className="orbit" />
              <span className="orbit reverse" />
            </div>
          )}
          <div className="container hero-content">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1 style={{ marginTop: eyebrow ? "1.25rem" : 0 }}>{headline}</h1>
            {subtitle && <p className="subtitle">{subtitle}</p>}
            <div className="cta-row">
              {ctaPrimaryLabel && (
                <a href={ctaPrimaryUrl} className="btn btn-primary">
                  {ctaPrimaryLabel}
                </a>
              )}
              {ctaSecondaryLabel && (
                <a href={ctaSecondaryUrl} className="btn btn-secondary">
                  {ctaSecondaryLabel}
                </a>
              )}
            </div>
          </div>
        </section>
      ),
    },

    Heading: {
      label: "Überschrift",
      fields: {
        text: { type: "text" },
        level: {
          type: "select",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
          ],
        },
        align: alignField,
      },
      defaultProps: { text: "Überschrift", level: "h2", align: "left" },
      render: ({ text, level, align }) => {
        const Tag = level;
        const cls = level === "h1" ? "" : "section-title";
        return (
          <div className="container">
            <Tag className={cls} style={{ textAlign: align }}>
              {text}
            </Tag>
          </div>
        );
      },
    },

    Text: {
      label: "Text",
      fields: {
        text: { type: "textarea" },
        align: alignField,
        muted: {
          type: "radio",
          options: [
            { label: "Normal", value: false },
            { label: "Gedämpft", value: true },
          ],
        },
      },
      defaultProps: { text: "Ein Absatz Text.", align: "left", muted: false },
      render: ({ text, align, muted }) => (
        <div className="container">
          <p className={muted ? "muted" : ""} style={{ textAlign: align, whiteSpace: "pre-wrap" }}>
            {text}
          </p>
        </div>
      ),
    },

    ImageBlock: {
      label: "Bild",
      fields: {
        src: imageField,
        alt: { type: "text" },
        maxWidth: { type: "text" },
        rounded: {
          type: "radio",
          options: [
            { label: "Rund", value: true },
            { label: "Eckig", value: false },
          ],
        },
      },
      defaultProps: { src: "", alt: "", maxWidth: "100%", rounded: true },
      render: ({ src, alt, rounded, maxWidth }) =>
        src ? (
          <div className="container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              style={{
                maxWidth,
                width: "100%",
                height: "auto",
                borderRadius: rounded ? "var(--radius)" : 0,
                display: "block",
                marginInline: "auto",
              }}
            />
          </div>
        ) : (
          <div className="container muted">Bild-URL eingeben …</div>
        ),
    },

    Button: {
      label: "Button",
      fields: {
        label: { type: "text" },
        href: { type: "text" },
        variant: {
          type: "select",
          options: [
            { label: "Primär", value: "primary" },
            { label: "Sekundär", value: "secondary" },
            { label: "Ghost", value: "ghost" },
          ],
        },
      },
      defaultProps: { label: "Mehr erfahren", href: "#", variant: "primary" },
      render: ({ label, href, variant }) => (
        <div className="container">
          <a href={href} className={`btn btn-${variant}`}>
            {label}
          </a>
        </div>
      ),
    },

    Columns: {
      label: "Spalten",
      fields: {
        count: {
          type: "radio",
          options: [
            { label: "2", value: "2" },
            { label: "3", value: "3" },
          ],
        },
        gap: { type: "text" },
        col0: { type: "slot" },
        col1: { type: "slot" },
        col2: { type: "slot" },
      },
      defaultProps: { count: "2", gap: "1.25rem" },
      render: ({ count, gap, ...slots }: any) => {
        const Col0 = slots.col0;
        const Col1 = slots.col1;
        const Col2 = slots.col2;
        return (
          <div className="container">
            <div
              style={{
                display: "grid",
                gap,
                gridTemplateColumns: `repeat(${count}, minmax(0,1fr))`,
              }}
            >
              <div><Col0 /></div>
              <div><Col1 /></div>
              {count === "3" && <div><Col2 /></div>}
            </div>
          </div>
        );
      },
    },

    Section: {
      label: "Sektion",
      fields: {
        padded: {
          type: "radio",
          options: [
            { label: "Mit Abstand", value: true },
            { label: "Kompakt", value: false },
          ],
        },
        surface: {
          type: "radio",
          options: [
            { label: "Transparent", value: false },
            { label: "Karte", value: true },
          ],
        },
        content: { type: "slot" },
      },
      defaultProps: { padded: true, surface: false },
      render: ({ padded, surface, ...slots }: any) => {
        const Content = slots.content;
        return (
          <section
            style={{
              paddingBlock: padded ? "var(--space-section)" : "1rem",
              background: surface ? "var(--surface)" : "transparent",
              borderBlock: surface ? "1px solid var(--border)" : "none",
            }}
          >
            <Content />
          </section>
        );
      },
    },

    CtaBand: {
      label: "CTA-Band",
      fields: {
        title: { type: "text" },
        text: { type: "textarea" },
        buttonLabel: { type: "text" },
        buttonUrl: { type: "text" },
      },
      defaultProps: {
        title: "Bereit loszulegen?",
        text: "Kurzer überzeugender Satz.",
        buttonLabel: "Jetzt starten",
        buttonUrl: "#",
      },
      render: ({ title, text, buttonLabel, buttonUrl }) => (
        <section className="section">
          <div className="container">
            <div className="card newsletter-card">
              <h2 className="section-title">{title}</h2>
              {text && <p className="muted" style={{ marginTop: "0.5rem" }}>{text}</p>}
              {buttonLabel && (
                <div style={{ marginTop: "1.5rem" }}>
                  <a href={buttonUrl} className="btn btn-primary">
                    {buttonLabel}
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      ),
    },

    FeatureGrid: {
      label: "Feature-Karten",
      fields: {
        title: { type: "text" },
        items: {
          type: "array",
          arrayFields: {
            title: { type: "text" },
            text: { type: "textarea" },
            image: imageField,
          },
          defaultItemProps: { title: "Feature", text: "Beschreibung", image: "" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getItemSummary: (item: any) => item.title || "Feature",
        },
      },
      defaultProps: {
        title: "Was ich mache",
        items: [
          { title: "Web-Entwicklung", text: "Moderne Sites mit Next.js & TypeScript.", image: "" },
          { title: "Automatisierung", text: "Workflows, die Arbeit abnehmen.", image: "" },
          { title: "KI-Integration", text: "LLMs sinnvoll in Produkte einbauen.", image: "" },
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ title, items }: any) => (
        <section className="section">
          <div className="container">
            {title && <h2 className="section-title">{title}</h2>}
            <div className="grid grid-3" style={{ marginTop: "2.5rem" }}>
              {(items ?? []).map(
                (it: { title: string; text: string; image?: string }, i: number) => (
                  <div key={i} className="card">
                    {it.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.image}
                        alt=""
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 12,
                          marginBottom: "1rem",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <h3>{it.title}</h3>
                    {it.text && (
                      <p className="muted" style={{ marginTop: "0.5rem" }}>
                        {it.text}
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      ),
    },

    Quote: {
      label: "Zitat",
      fields: {
        quote: { type: "textarea" },
        person: { type: "text" },
        image: imageField,
      },
      defaultProps: { quote: "Großartige Arbeit, sehr zuverlässig!", person: "Anna B.", image: "" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ quote, person, image }: any) => (
        <section className="section">
          <div className="container">
            <figure className="card" style={{ margin: 0, maxWidth: 640 }}>
              <blockquote style={{ margin: 0, fontSize: "1.15rem" }}>“{quote}”</blockquote>
              <figcaption
                style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}
              >
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" width={40} height={40} style={{ borderRadius: 999 }} />
                )}
                <span className="muted">{person}</span>
              </figcaption>
            </figure>
          </div>
        </section>
      ),
    },

    LogoStrip: {
      label: "Logo-Leiste",
      fields: {
        title: { type: "text" },
        logos: {
          type: "array",
          arrayFields: { image: imageField, alt: { type: "text" } },
          defaultItemProps: { image: "", alt: "" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getItemSummary: (item: any) => item.alt || "Logo",
        },
      },
      defaultProps: { title: "Womit ich arbeite", logos: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ title, logos }: any) => (
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
              {(logos ?? [])
                .filter((l: { image?: string }) => l.image)
                .map((l: { image: string; alt?: string }, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={l.image}
                    alt={l.alt ?? ""}
                    style={{ height: 32, width: "auto", objectFit: "contain" }}
                  />
                ))}
            </div>
          </div>
        </section>
      ),
    },

    LatestPosts: {
      label: "Neueste Beiträge",
      fields: {
        title: { type: "text" },
        lang: {
          type: "select",
          options: [
            { label: "Deutsch", value: "de" },
            { label: "English", value: "en" },
          ],
        },
        tag: { type: "text" },
        limit: { type: "number", min: 1, max: 12 },
      },
      defaultProps: { title: "Neueste Beiträge", lang: "de", tag: "", limit: 3 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ title, lang, tag, limit }: any) => (
        <LatestPostsBlock title={title} lang={lang} tag={tag} limit={limit} />
      ),
    },

    Spacer: {
      label: "Abstand",
      fields: {
        size: {
          type: "select",
          options: [
            { label: "Klein", value: "s" },
            { label: "Mittel", value: "m" },
            { label: "Groß", value: "l" },
            { label: "XL", value: "xl" },
          ],
        },
      },
      defaultProps: { size: "m" },
      render: ({ size }) => {
        const map: Record<string, string> = { s: "1rem", m: "2.5rem", l: "4rem", xl: "7rem" };
        return <div style={{ height: map[size] ?? "2.5rem" }} />;
      },
    },

    Divider: {
      label: "Trennlinie",
      fields: {},
      defaultProps: {},
      render: () => (
        <div className="container">
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "2rem 0" }} />
        </div>
      ),
    },
  },

  categories: {
    layout: { components: ["Section", "Columns", "Spacer", "Divider"] },
    content: { components: ["Heading", "Text", "ImageBlock", "Button"] },
    sections: {
      components: ["Hero", "FeatureGrid", "Quote", "LogoStrip", "LatestPosts", "CtaBand"],
    },
  },
};

export default config;
