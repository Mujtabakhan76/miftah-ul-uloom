"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";
import TextReader from "@/components/TextReader";
import InBookSearch from "@/components/InBookSearch";
import type { BookSummary } from "@/lib/types";

export default function ReaderClient({ book }: { book: BookSummary }) {
  const [page, setPage] = useState(1);

  function jumpToPage(p: number) {
    setPage(p);
  }

  const isDocx = book.fileType === "docx";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="arabic-text text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
          {book.arabicTitle || book.title}
        </h1>
        {book.urduTitle && <p className="urdu-text text-gray-500">{book.urduTitle}</p>}
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
          {book.author && <span>مصنف: {book.author}</span>}
          <span>موضوع: {book.category}</span>
          <span>{book.pageCount} صفحات</span>
          {isDocx && <span>Word Document</span>}
        </div>
        {!book.isSearchable && (
          <p className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            <AlertTriangle size={14} />
            یہ فائل searchable نہیں ہے۔ OCR کی ضرورت ہو سکتی ہے۔
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {isDocx ? (
          <TextReader
            bookId={book._id}
            pageCount={book.pageCount || 1}
            currentPage={page}
            onPageChange={setPage}
            bookTitle={book.arabicTitle || book.title}
            bookAuthor={book.author}
            fileUrl={book.pdfUrl}
          />
        ) : (
          <PdfViewer
            pdfUrl={book.pdfUrl}
            pageCount={book.pageCount}
            currentPage={page}
            onPageChange={setPage}
            bookTitle={book.arabicTitle || book.title}
            bookAuthor={book.author}
          />
        )}
        <InBookSearch bookId={book._id} onJumpToPage={jumpToPage} />
      </div>
    </div>
  );
}
