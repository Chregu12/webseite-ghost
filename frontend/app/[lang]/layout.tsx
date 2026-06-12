import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { getDictionary, locales } from "@/i18n/dictionaries";
import { getSettings } from "@/lib/ghost/content";
import { getSiteConfig } from "@/lib/ghost/config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EditButton from "@/components/builder/EditButton";
import JsonLd from "@/components/JsonLd";
import { websiteLd, organizationLd } from "@/lib/jsonld";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// Avoid a flash of the wrong theme before hydration.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const settings = await getSettings();
  return {
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
      : undefined,
    title: {
      default: settings?.title ?? "Mein Blog",
      template: `%s — ${settings?.title ?? "Mein Blog"}`,
    },
    description: settings?.description ?? "",
    alternates: {
      languages: { de: "/de", en: "/en", "x-default": "/de" },
      types: { "application/rss+xml": `/${lang}/rss.xml` },
    },
    icons: settings?.icon
      ? { icon: settings.icon, apple: settings.icon }
      : undefined,
    openGraph: {
      type: "website",
      locale: lang,
      title: settings?.title ?? "Mein Blog",
      description: settings?.description ?? "",
      images: settings?.cover_image ? [settings.cover_image] : undefined,
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const settings = await getSettings();
  const config = await getSiteConfig(lang);
  const accent = settings?.accent_color || undefined;

  return (
    <html
      lang={lang}
      data-theme="dark"
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body style={accent ? ({ "--accent": accent } as React.CSSProperties) : undefined}>
        <JsonLd
          data={websiteLd({
            lang,
            name: settings?.title ?? "Mein Blog",
            description: settings?.description ?? "",
          })}
        />
        <JsonLd
          data={organizationLd({
            name: settings?.title ?? "Mein Blog",
            logo: settings?.logo,
            sameAs: Object.values(config.footer.social ?? {}),
          })}
        />
        <a href="#main" className="skip-link">
          {dict.actions.skipToContent}
        </a>
        <Header lang={lang} settings={settings} dict={dict} />
        <main id="main">{children}</main>
        <Footer config={config} dict={dict} />
        <EditButton />
      </body>
    </html>
  );
}
