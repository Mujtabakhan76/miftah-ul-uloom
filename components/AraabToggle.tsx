"use client";

export default function AraabToggle({
  showAraab,
  onChange,
}: {
  showAraab: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-full border p-0.5 text-xs"
      style={{ borderColor: "var(--color-border)" }}
    >
      <button
        onClick={() => onChange(true)}
        className="rounded-full px-3 py-1.5 transition-colors"
        style={{
          backgroundColor: showAraab ? "var(--color-primary)" : "transparent",
          color: showAraab ? "white" : "var(--color-ink-muted)",
        }}
      >
        اعراب دکھائیں
      </button>
      <button
        onClick={() => onChange(false)}
        className="rounded-full px-3 py-1.5 transition-colors"
        style={{
          backgroundColor: !showAraab ? "var(--color-primary)" : "transparent",
          color: !showAraab ? "white" : "var(--color-ink-muted)",
        }}
      >
        اعراب ہٹائیں
      </button>
      <span className="hidden sm:inline px-2 text-[11px]" style={{ color: "var(--color-ink-muted)" }}>
        اعراب: {showAraab ? "فعال" : "غیر فعال"}
      </span>
    </div>
  );
}
