import { getDocumentProxy } from "unpdf";
import { normalizeForSearch } from "./arabic";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  pages: ExtractedPage[];
  pageCount: number;
  isSearchable: boolean;
  failedPages: number[];
}

/**
 * Extract per-page text from a PDF buffer.
 * Uses `unpdf` to load the document — it's a serverless/edge-safe pdf.js
 * wrapper with no canvas/DOM dependency, so it works reliably on Vercel's
 * Node serverless functions (the previous pdfjs-dist "legacy" build could
 * crash there, which was the root cause of "PDF پروسیس نہیں ہو سکی").
 * Each page is extracted individually so one bad/corrupt page doesn't fail
 * the whole book — it's recorded in `failedPages` and the rest still saves.
 * Runs at upload time only — search never re-parses the PDF at query time.
 */
export async function extractPdfText(buffer: Buffer): Promise<ExtractionResult> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const totalPages = pdf.numPages;
  const pages: ExtractedPage[] = [];
  const failedPages: number[] = [];

  for (let i = 1; i <= totalPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");
      pages.push({ pageNumber: i, text });
    } catch (err) {
      console.error(`[extractPdfText] page ${i} failed:`, err);
      pages.push({ pageNumber: i, text: "" });
      failedPages.push(i);
    }
  }

  const totalChars = pages.reduce((sum, p) => sum + p.text.trim().length, 0);
  // Heuristic: near-empty extracted text usually means an image-only (scanned)
  // PDF — flag it for OCR instead of pretending it's indexed.
  const isSearchable = totalChars > totalPages * 5;

  return { pages, pageCount: totalPages, isSearchable, failedPages };
}

/** Build page.text + page.normalizedText records ready to store on the Book document. */
export function buildIndexedPages(pages: ExtractedPage[]) {
  return pages.map((p) => ({
    pageNumber: p.pageNumber,
    text: p.text,
    normalizedText: normalizeForSearch(p.text),
  }));
}
