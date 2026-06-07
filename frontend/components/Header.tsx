import Link from "next/link";
import type { GhostSettings } from "@/lib/ghost/types";
import type { Dictionary } from "@/i18n/dictionaries";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header({
  lang,
  settings,
  dict,
}: {
  lang: string;
  settings: GhostSettings | null;
  dict: Dictionary;
}) {
  const brand = settings?.title || "Mein Blog";
  const locales = ["de", "en"];
  // Ghost navigation URLs are site-relative and carry no locale (e.g. "/about/").
  // Prefix internal paths with the current locale; leave external links,
  // anchors and already-localized paths untouched.
  const localizeUrl = (url: string) => {
    if (!url.startsWith("/")) return url; // external or hash links
    const segments = url.split("/");
    if (locales.includes(segments[1])) return url; // already localized
    return `/${lang}${url === "/" ? "" : url}`;
  };
  const nav =
    settings?.navigation && settings.navigation.length > 0
      ? settings.navigation.map((item) => ({
          label: item.label,
          url: localizeUrl(item.url),
        }))
      : [
          { label: dict.nav.blog, url: `/${lang}/blog` },
          { label: dict.nav.about, url: `/${lang}/about` },
          { label: dict.nav.contact, url: `/${lang}/contact` },
        ];

  return (
    <header className="site-header">
      <div className="container">
        <Link href={`/${lang}`} className="brand">
          {brand}
        </Link>
        <nav className="nav">
          {nav.map((item) => (
            <Link key={item.url} href={item.url}>
              {item.label}
            </Link>
          ))}
          <Link href={`/${lang}/search`} aria-label={dict.nav.search} title={dict.nav.search}>
            ⌕
          </Link>
          <LanguageSwitcher lang={lang} label={dict.actions.switchLanguage} />
          <ThemeToggle label={dict.actions.toggleTheme} />
        </nav>
      </div>
    </header>
  );
}
