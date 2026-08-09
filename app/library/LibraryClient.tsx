"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import BookCard from "@/components/BookCard";
import type { BookSummary } from "@/lib/types";

export default function LibraryClient({
  initialBooks,
  categories,
}: {
  initialBooks: BookSummary[];
  categories: string[];
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [language, setLanguage] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [sort, setSort] = useState<string>("recent");

  const filtered = useMemo(() => {
    let books = [...initialBooks];
    if (language) books = books.filter((b) => b.language === language);
    if (category) books = books.filter((b) => b.category === category);
    if (sort === "alphabetical") {
      books.sort((a, b) => (a.arabicTitle || a.title).localeCompare(b.arabicTitle || b.title, "ar"));
    }
    return books;
  }, [initialBooks, language, category, sort]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3" style={{ borderColor: "var(--color-border)" }}>
        <Select value={language} onChange={setLanguage} label="زبان" options={[
          { value: "", label: "تمام زبانیں" },
          { value: "arabic", label: "عربی" },
          { value: "urdu", label: "اردو" },
          { value: "mixed", label: "عربی/اردو" },
        ]} />
        <Select value={category} onChange={setCategory} label="موضوع" options={[
          { value: "", label: "تمام موضوعات" },
          ...categories.map((c) => ({ value: c, label: c })),
        ]} />
        <Select value={sort} onChange={setSort} label="ترتیب" options={[
          { value: "recent", label: "حالیہ اضافہ" },
          { value: "alphabetical", label: "حروفِ تہجی" },
        ]} />

        <div className="ms-auto flex items-center gap-1 rounded-lg border p-1" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={() => setView("grid")}
            className="rounded p-1.5"
            style={{ backgroundColor: view === "grid" ? "var(--color-bg)" : "transparent" }}
            aria-label="گرڈ ویو"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className="rounded p-1.5"
            style={{ backgroundColor: view === "list" ? "var(--color-bg)" : "transparent" }}
            aria-label="لسٹ ویو"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border p-10 text-center text-sm text-gray-500" style={{ borderColor: "var(--color-border)" }}>
          کوئی نتیجہ نہیں ملا۔
        </p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((book) => (
            <BookCard key={book._id} book={book} view="list" />
          ))}
        </div>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-gray-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border px-2 py-1.5 text-sm text-gray-700"
        style={{ borderColor: "var(--color-border)" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
