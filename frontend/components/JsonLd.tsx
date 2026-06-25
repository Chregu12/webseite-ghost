// Renders a JSON-LD <script> for structured data (SEO).
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape characters that could prematurely close the <script> tag or be
  // interpreted as HTML, preventing injection from CMS-sourced strings.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
