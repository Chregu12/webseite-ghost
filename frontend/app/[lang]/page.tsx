import { getDictionary } from "@/i18n/dictionaries";
import { getSiteConfig } from "@/lib/ghost/config";
import { getPosts } from "@/lib/ghost/content";
import Hero from "@/components/sections/Hero";
import LatestPosts from "@/components/sections/LatestPosts";

// Revalidated on demand via Ghost webhooks; hourly safety net otherwise.
export const revalidate = 3600;

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const config = await getSiteConfig(lang);

  const posts = config.sections.latestPosts ? await getPosts({ lang, limit: 3 }) : [];

  return (
    <>
      <Hero config={config} />
      {/* TODO (M3): Logos, Features, Showcase, Testimonials, Newsletter sections,
          each gated by config.sections.* and sourced from internal-tagged posts. */}
      {config.sections.latestPosts && (
        <LatestPosts posts={posts} lang={lang} dict={dict} />
      )}
    </>
  );
}
