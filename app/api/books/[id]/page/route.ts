import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";

// GET /api/books/:id/page?number=N — returns one page's original text (used by TextReader for docx books)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const number = parseInt(new URL(req.url).searchParams.get("number") || "1", 10);

    const book = await Book.findById(id).select("pages").lean();
    if (!book) return NextResponse.json({ error: "کتاب نہیں ملی۔" }, { status: 404 });

    interface PageDoc {
      pageNumber: number;
      text: string;
    }
    const page = ((book.pages || []) as PageDoc[]).find((p) => p.pageNumber === number);
    return NextResponse.json({ text: page?.text || "" });
  } catch (err) {
    console.error("[GET /api/books/:id/page] failed:", err);
    return NextResponse.json({ error: "صفحہ لوڈ نہیں ہو سکا۔" }, { status: 500 });
  }
}
