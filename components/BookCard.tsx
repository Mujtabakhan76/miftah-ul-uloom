import Link from "next/link";
import Image from "next/image";
import { BookOpen, Search as SearchIcon, FileText } from "lucide-react";
import type { BookSummary } from "@/lib/types";

const LANGUAGE_LABEL: Record<BookSummary["language"], string> = {
  arabic: "عربی",
  urdu: "اردو",
  mixed: "عربی/اردو",
};

export default function BookCard({ book, view = "grid" }: { book: BookSummary; view?: "grid" | "list" }) {
  const displayTitle = book.arabicTitle || book.title;

  if (view === "list") {
    return (
      <div
        className="flex items-center gap-4 rounded-xl border bg-white p-3 hover:shadow-md transition-shadow"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Cover book={book} className="h-20 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="arabic-text truncate text-base font-semibold" style={{ color: "var(--color-primary)" }}>
            {displayTitle}
          </h3>
          {book.urduTitle && <p className="urdu-text truncate text-sm text-gray-500">{book.urduTitle}</p>}
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
            {book.author && <span>{book.author}</span>}
            <span>· {LANGUAGE_LABEL[book.language]}</span>
            <span>· {book.category}</span>
            {book.pageCount > 0 && <span>· {book.pageCount} صفحات</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Link href={`/library/${book._id}`} className="btn-primary text-xs">
            <BookOpen size={13} /> کتاب دیکھیں
          </Link>
          <Link href={`/library/${book._id}?focus=search`} className="btn-outline text-xs">
            <SearchIcon size={13} /> اس میں تلاش
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl border bg-white hover:shadow-lg transition-shadow"
      style={{ borderColor: "var(--color-border)" }}
    >
      <Cover book={book} className="h-56 w-full" />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="arabic-text text-base font-semibold leading-snug" style={{ color: "var(--color-primary)" }}>
          {displayTitle}
        </h3>
        {book.urduTitle && <p className="urdu-text mt-0.5 text-sm text-gray-500">{book.urduTitle}</p>}
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500">
          {book.author && <span>{book.author}</span>}
          <span
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-primary)" }}
          >
            {LANGUAGE_LABEL[book.language]}
          </span>
          <span
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-primary)" }}
          >
            {book.category}
          </span>
        </div>
        <div className="mt-auto pt-4 flex gap-2">
          <Link href={`/library/${book._id}`} className="btn-primary flex-1 text-xs">
            <BookOpen size={13} /> کتاب دیکھیں
          </Link>
          <Link
            href={`/library/${book._id}?focus=search`}
            className="btn-outline text-xs"
            aria-label="اس کتاب میں تلاش کریں"
          >
            <SearchIcon size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Cover({ book, className }: { book: BookSummary; className?: string }) {
  if (book.coverUrl) {
    return (
      <div className={`relative bg-gray-100 ${className}`}>
        <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="240px" />
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      <FileText className="text-white/60" size={32} />
    </div>
  );
}
