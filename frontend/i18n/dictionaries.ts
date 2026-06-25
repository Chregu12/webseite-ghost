import "server-only";

export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const dictionaries = {
  de: () => import("../messages/de.json").then((m) => m.default),
  en: () => import("../messages/en.json").then((m) => m.default),
} as const;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["de"]>>;

export async function getDictionary(locale: string): Promise<Dictionary> {
  const load = dictionaries[locale as Locale] ?? dictionaries[defaultLocale];
  return load();
}
