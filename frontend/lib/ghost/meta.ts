import type { Metadata } from "next";
import type { GhostPost, GhostPage } from "./types";
import { abs } from "@/lib/site";

/**
 * Build Next.js Metadata from a Ghost post/page, honouring the per-item SEO
 * fields editable in Ghost admin (meta_title/description, og_*, twitter_*,
 * canonical_url) with sensible fallbacks to the content's own title/excerpt
 * and feature image.
 */
export function contentMetadata(
  item: GhostPost | GhostPage,
  opts: {
    lang: string;
    /** Path without locale prefix, e.g. "/blog/my-post" or "/impressum". */
    path: string;
    ogType?: "article" | "website";
    publishedTime?: string | null;
    /** Comma-separated keywords (e.g. page tags). */
    keywords?: string;
    /** Exclude from search engines. */
    noindex?: boolean;
  },
): Metadata {
  const { lang, path, ogType = "website", publishedTime, keywords, noindex } = opts;

  const title = item.meta_title || item.title;
  const description =
    item.meta_description || item.custom_excerpt || item.excerpt || "";
  const canonical = item.canonical_url || abs(`/${lang}${path}`);
  const ogImage = item.og_image || item.feature_image || undefined;
  const twitterImage = item.twitter_image || ogImage;
  const keywordList = keywords
    ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  return {
    title,
    description,
    ...(keywordList && keywordList.length ? { keywords: keywordList } : {}),
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    alternates: {
      canonical,
      languages: {
        de: abs(`/de${path}`),
        en: abs(`/en${path}`),
        "x-default": abs(`/de${path}`),
      },
    },
    openGraph: {
      type: ogType,
      title: item.og_title || title,
      description: item.og_description || description,
      images: ogImage ? [ogImage] : undefined,
      ...(ogType === "article" && publishedTime
        ? { publishedTime: publishedTime ?? undefined }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: item.twitter_title || title,
      description: item.twitter_description || description,
      images: twitterImage ? [twitterImage] : undefined,
    },
  };
}
