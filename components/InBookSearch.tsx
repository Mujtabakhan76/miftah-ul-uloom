"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { highlightMatches } from "@/lib/arabic";
import AraabToggle from "./AraabToggle";

interface Result {
  pageNumber: number;
  snippet: string;
}

export default function InBookSearch({
  bookId,
  onJumpToPage,
}: {
  bookId: string;
  onJumpToPage: (page: number, term: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAraab, setShowAraab] = useState(true);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--color-border)" }}>
      <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
        اس کتاب میں تلاش کریں
      </h3>
      <form onSubmit={runSearch} className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="لفظ یا عبارت لکھیں..."
          className="arabic-text flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)]"
          style={{ borderColor: "var(--color-border)" }}
        />
        <button type="submit" className="btn-primary text-sm" disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
      </form>

      {results && results.length > 0 && (
        <div className="mb-2 flex justify-end">
          <AraabToggle showAraab={showAraab} onChange={setShowAraab} />
        </div>
      )}

      {results === null && (
        <p className="text-xs text-gray-400">تلاش شروع کرنے کے لیے لفظ درج کریں۔</p>
      )}
      {results !== null && results.length === 0 && (
        <p className="text-xs text-gray-500">اس کتاب میں مطلوبہ عبارت موجود نہیں۔</p>
      )}

      <ul className="space-y-2 max-h-[420px] overflow-y-auto">
        {results?.map((r, i) => (
          <li key={i}>
            <button
              onClick={() => onJumpToPage(r.pageNumber, query)}
              className="w-full rounded-lg border p-2.5 text-right hover:border-[var(--color-gold)] transition-colors"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="mb-1 text-[11px] font-medium" style={{ color: "var(--color-gold)" }}>
                صفحہ {r.pageNumber}
              </div>
              <p
                className="arabic-text text-sm leading-relaxed text-gray-700 line-clamp-3"
                dangerouslySetInnerHTML={{
                  __html: highlightMatches(showAraab ? r.snippet : stripDisplay(r.snippet), query),
                }}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Local helper kept tiny to avoid importing stripAraab just for display toggling here
function stripDisplay(text: string) {
  return text.replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0670\u08D4-\u08E1\u08E3-\u08FF\u0640]/g, "");
}
