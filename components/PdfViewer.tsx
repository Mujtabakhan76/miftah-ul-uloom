"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Maximize,
  Copy,
  Download,
} from "lucide-react";
import { stripAraab } from "@/lib/arabic";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  pdfUrl: string;
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  bookTitle: string;
  bookAuthor?: string;
}

export default function PdfViewer({
  pdfUrl,
  pageCount,
  currentPage,
  onPageChange,
  bookTitle,
  bookAuthor,
}: PdfViewerProps) {
  const [scale, setScale] = useState(1.2);
  const [numPages, setNumPages] = useState(pageCount);
  const [selection, setSelection] = useState<string>("");
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (text) {
      setSelection(text);
      const range = sel?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setSelectionPos({ x: rect.left + rect.width / 2, y: rect.top });
      }
    } else {
      setSelection("");
      setSelectionPos(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  async function copyText(withAraab: boolean) {
    const text = withAraab ? selection : stripAraab(selection);
    await navigator.clipboard.writeText(text);
    setSelectionPos(null);
  }

  async function exportDocx() {
    const text = selection;
    const res = await fetch("/api/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, bookTitle, author: bookAuthor, pageNumber: currentPage }),
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

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col bg-gray-100 rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
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
            صفحہ {currentPage} / {numPages || pageCount}
          </span>
          <button
            className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30"
            disabled={currentPage >= (numPages || pageCount)}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="اگلا صفحہ"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded p-1.5 hover:bg-gray-100" onClick={() => setScale((s) => Math.max(0.6, s - 0.15))} aria-label="زوم آؤٹ">
            <ZoomOut size={16} />
          </button>
          <span className="text-xs w-10 text-center text-gray-600">{Math.round(scale * 100)}%</span>
          <button className="rounded p-1.5 hover:bg-gray-100" onClick={() => setScale((s) => Math.min(3, s + 0.15))} aria-label="زوم ان">
            <ZoomIn size={16} />
          </button>
          <button className="rounded p-1.5 hover:bg-gray-100" onClick={toggleFullscreen} aria-label="فل اسکرین">
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* Page */}
      <div className="relative flex justify-center overflow-auto p-4" style={{ maxHeight: "75vh" }}>
        <Document
          file={pdfUrl}
          loading={<div className="py-20 text-sm text-gray-500">صفحہ لوڈ ہو رہا ہے...</div>}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          error={<div className="py-20 text-sm text-red-600">PDF لوڈ نہیں ہو سکی۔</div>}
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            renderAnnotationLayer
            renderTextLayer
          />
        </Document>

        {selectionPos && selection && (
          <div
            className="fixed z-50 flex gap-1 rounded-lg bg-white p-1 shadow-lg border"
            style={{
              borderColor: "var(--color-border)",
              left: selectionPos.x,
              top: Math.max(0, selectionPos.y - 44),
              transform: "translateX(-50%)",
            }}
          >
            <button className="btn-outline !py-1 !px-2 text-[11px]" onClick={() => copyText(true)}>
              <Copy size={12} /> کاپی (اعراب سمیت)
            </button>
            <button className="btn-outline !py-1 !px-2 text-[11px]" onClick={() => copyText(false)}>
              <Copy size={12} /> کاپی (بغیر اعراب)
            </button>
            <button className="btn-primary !py-1 !px-2 text-[11px]" onClick={exportDocx}>
              <Download size={12} /> Word
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
