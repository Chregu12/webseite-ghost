export default function SectionHeader({
  title,
  intro,
}: {
  title?: string;
  intro?: string;
}) {
  if (!title && !intro) return null;
  return (
    <div style={{ maxWidth: "60ch" }}>
      {title && <h2 className="section-title">{title}</h2>}
      {intro && (
        <p className="muted" style={{ marginTop: "0.75rem", fontSize: "1.05rem" }}>
          {intro}
        </p>
      )}
    </div>
  );
}
