import { getDictionary } from "@/i18n/dictionaries";
import { getSiteConfig } from "@/lib/ghost/config";
import { getPosts } from "@/lib/ghost/content";
import Hero from "@/components/sections/Hero";
import Logos from "@/components/sections/Logos";
import Features from "@/components/sections/Features";
import Showcase from "@/components/sections/Showcase";
import Testimonials from "@/components/sections/Testimonials";
import LatestPosts from "@/components/sections/LatestPosts";
import Newsletter from "@/components/sections/Newsletter";

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
  const { sections } = config;

  const posts = sections.latestPosts ? await getPosts({ lang, limit: 3 }) : [];

  return (
    <>
      <Hero config={config} />
      {sections.logos && <Logos config={config} lang={lang} />}
      {sections.features && <Features config={config} lang={lang} />}
      {sections.showcase && <Showcase config={config} lang={lang} />}
      {sections.testimonials && <Testimonials config={config} lang={lang} />}
      {sections.latestPosts && <LatestPosts posts={posts} lang={lang} dict={dict} />}
      {sections.newsletter && (
        <Newsletter
          title={config.content.newsletter.title}
          intro={config.content.newsletter.intro}
          buttonLabel={config.content.newsletter.buttonLabel}
          placeholder={dict.newsletter.placeholder}
          successText={dict.newsletter.success}
          errorText={dict.newsletter.error}
        />
      )}
    </>
  );
}
