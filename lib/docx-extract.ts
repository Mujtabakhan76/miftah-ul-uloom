import mammoth from "mammoth";
import { normalizeForSearch } from "./arabic";
import type { ExtractedPage } from "./pdf";

const CHARS_PER_VIRTUAL_PAGE = 2200; // roughly one reading screen of Arabic/Urdu text

export interface DocxExtractionResult {
  pages: ExtractedPage[];
  pageCount: number;
  isSearchable: boolean;
}

/**
 * Extract raw text from a .docx file and split it into "virtual pages" so the
 * rest of the system (page-wise search, page navigation, DOCX export of a
 * selection) works the same way it does for PDFs, even though Word documents
 * don't have a fixed page layout the way a PDF does.
 */
export async function extractDocxText(buffer: Buffer): Promise<DocxExtractionResult> {
  const { value: rawText } = await mammoth.extractRawText({ buffer });
  const text = rawText.trim();

  if (!text) {
    return { pages: [{ pageNumber: 1, text: "" }], pageCount: 1, isSearchable: false };
  }

  // Split on paragraph breaks first so we don't cut a sentence in half at the
  // page boundary, then greedily pack paragraphs into ~CHARS_PER_VIRTUAL_PAGE chunks.
  const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0);
  const pages: ExtractedPage[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > CHARS_PER_VIRTUAL_PAGE && current.length > 0) {
      pages.push({ pageNumber: pages.length + 1, text: current.trim() });
      current = "";
    }
    current += (current ? "\n" : "") + para;
  }
  if (current.trim()) {
    pages.push({ pageNumber: pages.length + 1, text: current.trim() });
  }

  return { pages, pageCount: pages.length, isSearchable: true };
}

/** Same shape as lib/pdf.ts's buildIndexedPages — kept here too so callers don't need to care. */
export function buildIndexedDocxPages(pages: ExtractedPage[]) {
  return pages.map((p) => ({
    pageNumber: p.pageNumber,
    text: p.text,
    normalizedText: normalizeForSearch(p.text),
  }));
}
