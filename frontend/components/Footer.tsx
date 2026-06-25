import type { SiteConfig } from "@/lib/ghost/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function Footer({
  config,
  dict,
}: {
  config: SiteConfig;
  dict: Dictionary;
}) {
  const year = new Date().getFullYear();
  const social = Object.entries(config.footer.social ?? {});

  return (
    <footer className="site-footer">
      <div className="container">
        <span>{config.footer.text || `© ${year} — ${dict.footer.rights}`}</span>
        {social.length > 0 && (
          <div className="social-row">
            {social.map(([name, url]) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                {name}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
