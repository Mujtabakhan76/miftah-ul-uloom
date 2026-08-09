"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import BookCard from "@/components/BookCard";
import { highlightMatches } from "@/lib/arabic";
import type { BookSummary } from "@/lib/types";

interface ContentResult {
  bookId: string;
  title: string;
  arabicTitle?: string;
  urduTitle?: string;
  author?: string;
  pageNumber: number;
  snippet: string;
}

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [mode, setMode] = useState<"books" | "content">("books");
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [bookResults, setBookResults] = useState<BookSummary[] | null>(null);
  const [contentResults, setContentResults] = useState<ContentResult[] | null>(null);

  async function runSearch(q: string, m: "books" | "content") {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&mode=${m}`);
      const data = await res.json();
      if (m === "books") setBookResults(data.results || []);
      else setContentResults(data.results || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) runSearch(initialQuery, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-4 flex justify-center gap-2">
        <ModeButton active={mode === "books"} onClick={() => setMode("books")}>
          کتابوں کے نام سے تلاش
        </ModeButton>
        <ModeButton active={mode === "content"} onClick={() => setMode("content")}>
          تمام کتب میں تلاش
        </ModeButton>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query, mode);
        }}
        className="mx-auto flex max-w-xl items-center gap-2 rounded-full border bg-white p-1.5 shadow-sm"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="کتاب یا عبارت تلاش کریں"
          className="arabic-text flex-1 rounded-full bg-transparent px-4 py-2.5 text-sm outline-none"
        />
        <button type="submit" className="btn-primary text-sm" disabled={loading}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </form>

      <div className="mt-8">
        {mode === "books" && (
          <>
            {bookResults === null && <Hint text="کتاب کا نام، مصنف یا موضوع لکھ کر تلاش کریں۔" />}
            {bookResults !== null && bookResults.length === 0 && <Hint text="کوئی نتیجہ نہیں ملا۔" />}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {bookResults?.map((b) => (
                <BookCard key={b._id} book={b} />
              ))}
            </div>
          </>
        )}

        {mode === "content" && (
          <>
            {contentResults === null && <Hint text="مکمل لائبریری میں تلاش کے لیے لفظ درج کریں۔" />}
            {contentResults !== null && contentResults.length === 0 && <Hint text="کوئی نتیجہ نہیں ملا۔" />}
            <ul className="space-y-3">
              {contentResults?.map((r, i) => (
                <li key={i}>
                  <Link
                    href={`/library/${r.bookId}`}
                    className="block rounded-xl border bg-white p-4 hover:border-[var(--color-gold)] transition-colors"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="arabic-text font-semibold" style={{ color: "var(--color-primary)" }}>
                        {r.arabicTitle || r.title}
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: "var(--color-gold)" }}>
                        صفحہ {r.pageNumber}
                      </span>
                    </div>
                    {r.author && <p className="mb-1 text-xs text-gray-500">{r.author}</p>}
                    <p
                      className="arabic-text text-sm leading-relaxed text-gray-700"
                      dangerouslySetInnerHTML={{ __html: highlightMatches(r.snippet, query) }}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
      style={{
        backgroundColor: active ? "var(--color-primary)" : "white",
        color: active ? "white" : "var(--color-ink-muted)",
        border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
      }}
    >
      {children}
    </button>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <p className="rounded-lg border p-8 text-center text-sm text-gray-500" style={{ borderColor: "var(--color-border)" }}>
      {text}
    </p>
  );
}
