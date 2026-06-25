import Link from "next/link";
import Image from "next/image";
import type { SiteConfig } from "@/lib/ghost/config";

export default function Hero({ config }: { config: SiteConfig }) {
  const { hero } = config;
  return (
    <section className="hero">
      {!hero.visual && (
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
        {hero.eyebrow && <span className="eyebrow">{hero.eyebrow}</span>}
        <h1 style={{ marginTop: hero.eyebrow ? "1.25rem" : 0 }}>{hero.headline}</h1>
        {hero.subtitle && <p className="subtitle">{hero.subtitle}</p>}
        <div className="cta-row">
          {hero.ctaPrimary.label && (
            <Link href={hero.ctaPrimary.url} className="btn btn-primary">
              {hero.ctaPrimary.label}
            </Link>
          )}
          {hero.ctaSecondary.label && (
            <Link href={hero.ctaSecondary.url} className="btn btn-secondary">
              {hero.ctaSecondary.label}
            </Link>
          )}
        </div>
        {hero.visual && (
          <div className="hero-visual">
            <Image
              src={hero.visual}
              alt=""
              width={1120}
              height={630}
              priority
              sizes="(max-width: 1120px) 100vw, 1120px"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
