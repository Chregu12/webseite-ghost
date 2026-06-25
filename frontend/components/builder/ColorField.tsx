"use client";

// Custom Puck field: a color picker with a hex input and a clear button.
export default function ColorField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 36, height: 32, padding: 0, border: "1px solid #ccc", borderRadius: 6, background: "none" }}
      />
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000 oder leer"
        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", flex: 1, minWidth: 0 }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="Zurücksetzen"
          style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1rem" }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
