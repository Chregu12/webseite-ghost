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
  const nav =
    settings?.navigation && settings.navigation.length > 0
      ? settings.navigation
      : [
          { label: dict.nav.blog, url: `/${lang}/blog` },
          { label: dict.nav.about, url: `/${lang}/about` },
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
          <LanguageSwitcher lang={lang} label={dict.actions.switchLanguage} />
          <ThemeToggle label={dict.actions.toggleTheme} />
        </nav>
      </div>
    </header>
  );
}
