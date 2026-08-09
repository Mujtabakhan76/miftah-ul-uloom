"use client";

import { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft, Copy, Download, FileDown } from "lucide-react";
import { stripAraab } from "@/lib/arabic";

interface TextReaderProps {
  bookId: string;
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  bookTitle: string;
  bookAuthor?: string;
  fileUrl: string;
}

export default function TextReader({
  bookId,
  pageCount,
  currentPage,
  onPageChange,
  bookTitle,
  bookAuthor,
  fileUrl,
}: TextReaderProps) {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/books/${bookId}/page?number=${currentPage}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setText(data.text || "");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, currentPage]);

  function handleMouseUp() {
    const sel = window.getSelection()?.toString().trim() || "";
    setSelection(sel);
  }

  async function copyText(withAraab: boolean) {
    const t = withAraab ? selection : stripAraab(selection);
    await navigator.clipboard.writeText(t || (withAraab ? text : stripAraab(text)));
  }

  async function exportDocx() {
    const t = selection || text;
    const res = await fetch("/api/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t, bookTitle, author: bookAuthor, pageNumber: currentPage }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "miftah-export.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col bg-white rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b bg-white px-3 py-2"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-1">
          <button
            className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="پچھلا صفحہ"
          >
            <ChevronRight size={18} />
          </button>
          <span className="text-xs text-gray-600 min-w-[70px] text-center">
            صفحہ {currentPage} / {pageCount}
          </span>
          <button
            className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30"
            disabled={currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="اگلا صفحہ"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <a href={fileUrl} download className="btn-outline text-xs">
          <FileDown size={13} /> اصل Word فائل ڈاؤن لوڈ کریں
        </a>
      </div>

      {/* Text content */}
      <div
        onMouseUp={handleMouseUp}
        className="p-6 overflow-auto"
        style={{ maxHeight: "70vh" }}
      >
        {loading ? (
          <p className="text-sm text-gray-400">صفحہ لوڈ ہو رہا ہے...</p>
        ) : (
          <p className="arabic-text text-lg leading-loose whitespace-pre-wrap" style={{ color: "var(--color-ink)" }}>
            {text || "اس صفحہ پر متن موجود نہیں۔"}
          </p>
        )}
      </div>

      {/* Copy / export tools */}
      <div
        className="flex flex-wrap gap-2 border-t bg-gray-50 px-3 py-2"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button className="btn-outline text-xs" onClick={() => copyText(true)}>
          <Copy size={13} /> کاپی (اعراب سمیت)
        </button>
        <button className="btn-outline text-xs" onClick={() => copyText(false)}>
          <Copy size={13} /> کاپی (بغیر اعراب)
        </button>
        <button className="btn-primary text-xs" onClick={exportDocx}>
          <Download size={13} /> Word Export
        </button>
      </div>
    </div>
  );
}
