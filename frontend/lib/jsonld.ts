import type { GhostPost, GhostAuthor } from "./ghost/types";
import { abs } from "./site";

// Structured data (schema.org) builders. Rich, accurate JSON-LD helps AI search
// / answer engines (ChatGPT Search, Perplexity, Google AI Overviews, Gemini)
// understand and cite the content.

export function websiteLd(opts: {
  lang: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: opts.name,
    description: opts.description,
    url: abs(`/${opts.lang}`),
    inLanguage: opts.lang,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: abs(`/${opts.lang}/search?q={search_term_string}`),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationLd(opts: {
  name: string;
  logo?: string | null;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts.name,
    url: abs("/"),
    ...(opts.logo
      ? { logo: { "@type": "ImageObject", url: opts.logo } }
      : {}),
    ...(opts.sameAs && opts.sameAs.length ? { sameAs: opts.sameAs } : {}),
  };
}

export function blogPostingLd(
  post: GhostPost,
  opts: { lang: string; siteName: string; logo?: string | null },
) {
  const url = abs(`/${opts.lang}/blog/${post.slug}`);
  const image = post.og_image || post.feature_image;
  const keywords = (post.tags ?? [])
    .filter((t) => t.visibility === "public" && !t.name.startsWith("#"))
    .map((t) => t.name);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta_title || post.title,
    description: post.meta_description || post.custom_excerpt || post.excerpt || undefined,
    image: image ? [image] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    inLanguage: opts.lang,
    author: post.primary_author
      ? { "@type": "Person", name: post.primary_author.name }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: opts.siteName,
      ...(opts.logo ? { logo: { "@type": "ImageObject", url: opts.logo } } : {}),
    },
    keywords: keywords.length ? keywords : undefined,
    mainEntityOfPage: url,
    url,
    // Mark the main content as speakable for voice / generative assistants.
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".prose"],
    },
  };
}

export function personLd(author: GhostAuthor, opts: { url: string }) {
  const sameAs = [
    author.website,
    author.twitter,
    author.facebook,
    author.mastodon,
    author.bluesky,
    author.threads,
    author.linkedin,
    author.instagram,
    author.youtube,
  ].filter((v): v is string => !!v && /^https?:\/\//.test(v));
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: opts.url,
    ...(author.profile_image ? { image: author.profile_image } : {}),
    ...(author.bio ? { description: author.bio } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
