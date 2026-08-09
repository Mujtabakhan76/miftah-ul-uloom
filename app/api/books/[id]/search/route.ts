import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";
import { normalizeForSearch, makeSnippet } from "@/lib/arabic";

// GET /api/books/:id/search?q=... — searches ONLY the given book's indexed pages.
// Diacritic-insensitive: query and stored text are both matched on normalizedText.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json({ results: [], query: q });
  }

  const book = await Book.findById(id).select("title pages").lean();
  if (!book) {
    return NextResponse.json({ error: "کتاب نہیں ملی۔" }, { status: 404 });
  }

  const normalizedQuery = normalizeForSearch(q);

  // 100 books / a few thousand pages total — an in-memory scan over one book's
  // already-normalized pages is effectively instant; no DB round-trip needed per page.
  interface PageDoc {
    pageNumber: number;
    text: string;
    normalizedText: string;
  }

  const results = ((book.pages || []) as PageDoc[])
    .filter((p) => p.normalizedText.includes(normalizedQuery))
    .map((p) => ({
      pageNumber: p.pageNumber,
      snippet: makeSnippet(p.text, q),
    }));

  return NextResponse.json({
    query: q,
    bookTitle: book.title,
    resultCount: results.length,
    results,
  });
}
