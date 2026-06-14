import type { Config } from "@measured/puck";
import ImageField from "@/components/builder/ImageField";
import ColorField from "@/components/builder/ColorField";
import LatestPostsBlock from "@/components/builder/blocks/LatestPostsBlock";
import AuthorsBlock from "@/components/builder/blocks/AuthorsBlock";
import TagCloudBlock from "@/components/builder/blocks/TagCloudBlock";
import Newsletter from "@/components/sections/Newsletter";
import ContactForm from "@/components/ContactForm";

// Reusable color field.
const colorField = {
  type: "custom" as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: ({ value, onChange }: any) => <ColorField value={value} onChange={onChange} />,
};

const langField = {
  type: "select" as const,
  options: [
    { label: "Deutsch", value: "de" },
    { label: "English", value: "en" },
  ],
};

// Turn a YouTube/Vimeo URL into an embeddable URL.
function toEmbed(url: string): string | null {
  if (!url) return null;
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}

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
        bgImage: imageField,
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
        bgImage: "",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({
        eyebrow,
        headline,
        subtitle,
        ctaPrimaryLabel,
        ctaPrimaryUrl,
        ctaSecondaryLabel,
        ctaSecondaryUrl,
        rings,
        bgImage,
      }: any) => (
        <section
          className="hero"
          style={
            bgImage
              ? {
                  backgroundImage: `linear-gradient(rgba(10,10,11,.6),rgba(10,10,11,.6)), url(${bgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
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
        bg: colorField,
        bgImage: imageField,
        content: { type: "slot" },
      },
      defaultProps: { padded: true, bg: "", bgImage: "" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ padded, bg, bgImage, ...slots }: any) => {
        const Content = slots.content;
        const background = bgImage
          ? `linear-gradient(rgba(10,10,11,.5),rgba(10,10,11,.5)), url(${bgImage}) center/cover`
          : bg || undefined;
        return (
          <section
            style={{
              paddingBlock: padded ? "var(--space-section)" : "1rem",
              background,
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

    Authors: {
      label: "Autoren",
      fields: { title: { type: "text" }, lang: langField },
      defaultProps: { title: "Autoren", lang: "de" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ title, lang }: any) => <AuthorsBlock title={title} lang={lang} />,
    },

    TagCloud: {
      label: "Tag-Wolke",
      fields: { title: { type: "text" }, lang: langField },
      defaultProps: { title: "Themen", lang: "de" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ title, lang }: any) => <TagCloudBlock title={title} lang={lang} />,
    },

    Video: {
      label: "Video",
      fields: { url: { type: "text" }, caption: { type: "text" } },
      defaultProps: { url: "", caption: "" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ url, caption }: any) => {
        const embed = toEmbed(url);
        return (
          <section className="section">
            <div className="container">
              {embed ? (
                <div
                  style={{
                    position: "relative",
                    paddingTop: "56.25%",
                    borderRadius: "var(--radius)",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  <iframe
                    src={embed}
                    title={caption || "Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  />
                </div>
              ) : (
                <p className="muted">Video-URL (YouTube/Vimeo) eingeben …</p>
              )}
              {caption && (
                <p className="muted" style={{ marginTop: "0.75rem", textAlign: "center" }}>
                  {caption}
                </p>
              )}
            </div>
          </section>
        );
      },
    },

    Accordion: {
      label: "Akkordeon / FAQ",
      fields: {
        title: { type: "text" },
        items: {
          type: "array",
          arrayFields: { question: { type: "text" }, answer: { type: "textarea" } },
          defaultItemProps: { question: "Frage?", answer: "Antwort." },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getItemSummary: (item: any) => item.question || "Eintrag",
        },
      },
      defaultProps: {
        title: "Häufige Fragen",
        items: [
          { question: "Wie funktioniert das?", answer: "So und so." },
          { question: "Was kostet es?", answer: "Nichts." },
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ title, items }: any) => {
        const list: { question: string; answer: string }[] = (items ?? []).filter(
          (it: { question?: string }) => it.question,
        );
        const faq = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: list.map((it) => ({
            "@type": "Question",
            name: it.question,
            acceptedAnswer: { "@type": "Answer", text: it.answer || "" },
          })),
        };
        const json = JSON.stringify(faq).replace(/</g, "\\u003c");
        return (
          <section className="section">
            <div className="container">
              {list.length > 0 && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
              )}
              {title && <h2 className="section-title">{title}</h2>}
              <div style={{ marginTop: "1.5rem", display: "grid", gap: "0.5rem", maxWidth: 760 }}>
                {list.map((it, i) => (
                  <details key={i} className="card" style={{ padding: "1rem 1.25rem" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 600 }}>{it.question}</summary>
                    <p className="muted" style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
                      {it.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        );
      },
    },

    NewsletterBlock: {
      label: "Newsletter",
      fields: {
        title: { type: "text" },
        intro: { type: "text" },
        buttonLabel: { type: "text" },
      },
      defaultProps: {
        title: "Bleib auf dem Laufenden",
        intro: "Neue Beiträge direkt per E-Mail.",
        buttonLabel: "Abonnieren",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ title, intro, buttonLabel }: any) => (
        <Newsletter
          title={title}
          intro={intro}
          buttonLabel={buttonLabel}
          placeholder="deine@email.de"
          successText="Fast geschafft – bitte bestätige die E-Mail in deinem Postfach."
          errorText="Etwas ist schiefgelaufen. Bitte versuche es später erneut."
        />
      ),
    },

    ContactBlock: {
      label: "Kontaktformular",
      fields: { title: { type: "text" } },
      defaultProps: { title: "Kontakt" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ title }: any) => (
        <section className="section">
          <div className="container">
            {title && <h2 className="section-title">{title}</h2>}
            <div style={{ marginTop: "1.5rem" }}>
              <ContactForm
                labels={{
                  name: "Name",
                  email: "E-Mail",
                  message: "Nachricht",
                  send: "Senden",
                  success: "Danke! Deine Nachricht wurde gesendet.",
                  error: "Senden fehlgeschlagen. Bitte später erneut versuchen.",
                }}
              />
            </div>
          </div>
        </section>
      ),
    },

    Gallery: {
      label: "Galerie",
      fields: {
        title: { type: "text" },
        columns: {
          type: "select",
          options: [
            { label: "2", value: "2" },
            { label: "3", value: "3" },
            { label: "4", value: "4" },
          ],
        },
        images: {
          type: "array",
          arrayFields: { image: imageField, alt: { type: "text" } },
          defaultItemProps: { image: "", alt: "" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getItemSummary: (item: any) => item.alt || "Bild",
        },
      },
      defaultProps: { title: "", columns: "3", images: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ title, columns, images }: any) => (
        <section className="section">
          <div className="container">
            {title && <h2 className="section-title">{title}</h2>}
            <div
              style={{
                marginTop: title ? "2rem" : 0,
                display: "grid",
                gap: "1rem",
                gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
              }}
            >
              {(images ?? [])
                .filter((im: { image?: string }) => im.image)
                .map((im: { image: string; alt?: string }, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={im.image}
                    alt={im.alt ?? ""}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius)", aspectRatio: "1" }}
                  />
                ))}
            </div>
          </div>
        </section>
      ),
    },

    Stats: {
      label: "Zahlen",
      fields: {
        items: {
          type: "array",
          arrayFields: { value: { type: "text" }, label: { type: "text" } },
          defaultItemProps: { value: "100+", label: "Projekte" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getItemSummary: (item: any) => item.label || "Wert",
        },
      },
      defaultProps: {
        items: [
          { value: "10+", label: "Jahre" },
          { value: "200", label: "Projekte" },
          { value: "100%", label: "Leidenschaft" },
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ items }: any) => (
        <section className="section">
          <div className="container">
            <div
              style={{
                display: "grid",
                gap: "1.25rem",
                gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`,
                textAlign: "center",
              }}
            >
              {(items ?? []).map((it: { value: string; label: string }, i: number) => (
                <div key={i} className="card">
                  <div style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                    {it.value}
                  </div>
                  <div className="muted" style={{ marginTop: "0.25rem" }}>
                    {it.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ),
    },

    ButtonGroup: {
      label: "Button-Gruppe",
      fields: {
        align: alignField,
        buttons: {
          type: "array",
          arrayFields: {
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
          defaultItemProps: { label: "Button", href: "#", variant: "primary" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getItemSummary: (item: any) => item.label || "Button",
        },
      },
      defaultProps: {
        align: "left",
        buttons: [
          { label: "Loslegen", href: "#", variant: "primary" },
          { label: "Mehr", href: "#", variant: "secondary" },
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ align, buttons }: any) => (
        <div className="container">
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
            }}
          >
            {(buttons ?? []).map(
              (b: { label: string; href: string; variant: string }, i: number) => (
                <a key={i} href={b.href} className={`btn btn-${b.variant}`}>
                  {b.label}
                </a>
              ),
            )}
          </div>
        </div>
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

  root: {
    fields: {
      title: { type: "text" },
      metaTitle: { type: "text" },
      metaDescription: { type: "textarea" },
      ogImage: imageField,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: ({ children }: any) => <>{children}</>,
  },

  categories: {
    layout: { components: ["Section", "Columns", "Spacer", "Divider"] },
    content: {
      components: ["Heading", "Text", "ImageBlock", "Gallery", "Button", "ButtonGroup", "Video"],
    },
    sections: {
      components: [
        "Hero",
        "FeatureGrid",
        "Stats",
        "Quote",
        "LogoStrip",
        "LatestPosts",
        "Authors",
        "TagCloud",
        "Accordion",
        "NewsletterBlock",
        "ContactBlock",
        "CtaBand",
      ],
    },
  },
};

export default config;
