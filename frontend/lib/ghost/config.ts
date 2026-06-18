import { z } from "zod";
import { getPageBySlug } from "./content";
import type { Locale } from "@/i18n/dictionaries";

// ---------------------------------------------------------------------------
// Site configuration is edited in Ghost as a Page (slug `site-config` for DE,
// `site-config-en` for EN) containing a single JSON code block. We read the
// page's plaintext, parse the JSON, and validate it with zod. On any error we
// fall back to safe defaults so the site always builds and renders.
// ---------------------------------------------------------------------------

const ctaSchema = z.object({
  label: z.string().default(""),
  url: z.string().default("#"),
});

const siteConfigSchema = z.object({
  // Optional accent colour override (set via the dashboard). Falls back to the
  // Ghost brand colour when empty.
  accent: z.string().default(""),
  hero: z
    .object({
      eyebrow: z.string().default(""),
      headline: z.string().default("Willkommen"),
      subtitle: z.string().default(""),
      ctaPrimary: ctaSchema.default({ label: "", url: "#" }),
      ctaSecondary: ctaSchema.default({ label: "", url: "#" }),
      visual: z.string().nullable().default(null),
    })
    .default({}),
  sections: z
    .object({
      logos: z.boolean().default(true),
      features: z.boolean().default(true),
      showcase: z.boolean().default(true),
      latestPosts: z.boolean().default(true),
      testimonials: z.boolean().default(false),
      newsletter: z.boolean().default(true),
      comments: z.boolean().default(true),
    })
    .default({}),
  // Editable headings/intros per section (shown above the tagged content).
  content: z
    .object({
      logos: z
        .object({ title: z.string().default("") })
        .default({}),
      features: z
        .object({
          title: z.string().default("Features"),
          intro: z.string().default(""),
        })
        .default({}),
      showcase: z
        .object({
          title: z.string().default(""),
          intro: z.string().default(""),
        })
        .default({}),
      testimonials: z
        .object({
          title: z.string().default(""),
          intro: z.string().default(""),
        })
        .default({}),
      newsletter: z
        .object({
          title: z.string().default("Newsletter"),
          intro: z.string().default(""),
          buttonLabel: z.string().default("Abonnieren"),
        })
        .default({}),
    })
    .default({}),
  footer: z
    .object({
      text: z.string().default(""),
      social: z.record(z.string(), z.string()).default({}),
    })
    .default({}),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

// Parsed from an empty object => all defaults applied.
export const defaultSiteConfig: SiteConfig = siteConfigSchema.parse({});

const CONFIG_SLUG: Record<Locale, string> = {
  de: "site-config",
  en: "site-config-en",
};

/** Extract the first balanced-looking JSON object from arbitrary text. */
function extractJson(text: string): string | null {
  const trimmed = text.trim();
  // Slice from the first "{" to the last "}" even when the text already starts
  // with "{": there may be trailing content after the closing brace (e.g. a
  // note below the code block) that would otherwise break JSON.parse.
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return null;
}

export async function getSiteConfig(lang: string): Promise<SiteConfig> {
  const slug = CONFIG_SLUG[(lang as Locale) in CONFIG_SLUG ? (lang as Locale) : "de"];
  const page = await getPageBySlug(slug, "plaintext,html");
  const raw = page?.plaintext ?? "";
  if (!raw) return defaultSiteConfig;

  const jsonText = extractJson(raw);
  if (!jsonText) {
    console.warn(`[config] no JSON object found in page "${slug}", using defaults`);
    return defaultSiteConfig;
  }

  try {
    const parsed = JSON.parse(jsonText);
    const result = siteConfigSchema.safeParse(parsed);
    if (!result.success) {
      console.warn(
        `[config] "${slug}" failed validation, using defaults:`,
        result.error.flatten(),
      );
      return defaultSiteConfig;
    }
    return result.data;
  } catch (err) {
    console.warn(`[config] "${slug}" is not valid JSON, using defaults:`, err);
    return defaultSiteConfig;
  }
}
