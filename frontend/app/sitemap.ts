import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { locales } from "@/i18n/dictionaries";
import { getAllPosts, getPublicTags, getContentPages } from "@/lib/ghost/content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const lang of locales) {
    entries.push({ url: `${SITE_URL}/${lang}`, changeFrequency: "weekly", priority: 1 });
    entries.push({
      url: `${SITE_URL}/${lang}/blog`,
      changeFrequency: "daily",
      priority: 0.8,
    });
    entries.push({
      url: `${SITE_URL}/${lang}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    });
    entries.push({
      url: `${SITE_URL}/${lang}/contact`,
      changeFrequency: "yearly",
      priority: 0.4,
    });

    const posts = await getAllPosts(lang);
    for (const post of posts) {
      entries.push({
        url: `${SITE_URL}/${lang}/blog/${post.slug}`,
        lastModified: post.updated_at ?? post.published_at ?? undefined,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  const pages = await getContentPages();
  for (const lang of locales) {
    for (const page of pages) {
      entries.push({
        url: `${SITE_URL}/${lang}/${page.slug}`,
        lastModified: page.updated_at ?? page.published_at ?? undefined,
        changeFrequency: "monthly",
        priority: 0.4,
      });
    }
  }

  const tags = await getPublicTags();
  for (const lang of locales) {
    for (const tag of tags) {
      entries.push({
        url: `${SITE_URL}/${lang}/tags/${tag.slug}`,
        changeFrequency: "weekly",
        priority: 0.4,
      });
    }
  }

  return entries;
}
