import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";
import { getAdminSession } from "@/lib/auth";
import { deleteFile, uploadFile } from "@/lib/storage";
import { extractPdfText, buildIndexedPages } from "@/lib/pdf";
import { extractDocxText, buildIndexedDocxPages } from "@/lib/docx-extract";

const PDF_TYPE = "application/pdf";
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// GET /api/books/:id — public: single book detail (without full page text, used by reader shell)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const book = await Book.findById(id).select("-pages.text -pages.normalizedText").lean();
    if (!book) {
      return NextResponse.json({ error: "کتاب نہیں ملی۔" }, { status: 404 });
    }
    return NextResponse.json({ book });
  } catch (err) {
    console.error("[GET /api/books/:id] failed:", err);
    return NextResponse.json({ error: "کتاب لوڈ نہیں ہو سکی۔" }, { status: 500 });
  }
}

// PUT /api/books/:id — admin only: edit metadata, optionally replace PDF/Word file (re-indexes) or cover
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "غیر مجاز رسائی۔ دوبارہ لاگ ان کریں۔" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const existing = await Book.findById(id);
    if (!existing) return NextResponse.json({ error: "کتاب نہیں ملی۔" }, { status: 404 });

    const form = await req.formData();
    const fields: Record<string, unknown> = {};

    for (const key of ["title", "arabicTitle", "urduTitle", "author", "language", "category", "description"]) {
      const val = form.get(key);
      if (val !== null) fields[key] = String(val).trim();
    }
    const keywordsRaw = form.get("keywords");
    if (keywordsRaw !== null) {
      fields.keywords = String(keywordsRaw).split(",").map((k) => k.trim()).filter(Boolean);
    }
    const tagsRaw = form.get("tags");
    if (tagsRaw !== null) {
      fields.tags = String(tagsRaw).split(",").map((t) => t.trim()).filter(Boolean);
    }

    const newFile = form.get("pdf") as File | null; // field name "pdf" kept for form back-compat; accepts PDF or DOCX
    if (newFile && newFile.size > 0) {
      const isPdf = newFile.type === PDF_TYPE || newFile.name.toLowerCase().endsWith(".pdf");
      const isDocx = newFile.type === DOCX_TYPE || newFile.name.toLowerCase().endsWith(".docx");

      if (!isPdf && !isDocx) {
        return NextResponse.json(
          { error: "صرف PDF یا Word (.docx) فائل اپلوڈ کریں۔" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await newFile.arrayBuffer());

      try {
        if (isPdf) {
          const extraction = await extractPdfText(buffer);
          fields.pageCount = extraction.pageCount;
          fields.isSearchable = extraction.isSearchable;
          fields.pages = buildIndexedPages(extraction.pages);
        } else {
          const extraction = await extractDocxText(buffer);
          fields.pageCount = extraction.pageCount;
          fields.isSearchable = extraction.isSearchable;
          fields.pages = buildIndexedDocxPages(extraction.pages);
        }
      } catch (err) {
        console.error("[PUT /api/books/:id] extraction failed:", err);
        const detail = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
          { error: "فائل پروسیس نہیں ہو سکی۔ فائل خراب ہو سکتی ہے۔", details: detail },
          { status: 422 }
        );
      }

      const newUrl = await uploadFile(buffer, newFile.name, isPdf ? PDF_TYPE : DOCX_TYPE);
      await deleteFile(existing.pdfUrl);
      fields.pdfUrl = newUrl;
      fields.fileType = isPdf ? "pdf" : "docx";
    }

    const newCover = form.get("cover") as File | null;
    if (newCover && newCover.size > 0) {
      const buffer = Buffer.from(await newCover.arrayBuffer());
      const newCoverUrl = await uploadFile(buffer, newCover.name, newCover.type);
      if (existing.coverUrl) await deleteFile(existing.coverUrl);
      fields.coverUrl = newCoverUrl;
    }

    const updated = await Book.findByIdAndUpdate(id, fields, { new: true }).select("-pages");
    return NextResponse.json({ book: updated });
  } catch (err) {
    console.error("[PUT /api/books/:id] unexpected failure:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "تبدیلیاں محفوظ نہیں ہو سکیں۔", details: detail },
      { status: 500 }
    );
  }
}

// DELETE /api/books/:id — admin only: removes book + its files + its search index (embedded, so atomic)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "غیر مجاز رسائی۔" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const book = await Book.findById(id);
    if (!book) return NextResponse.json({ error: "کتاب نہیں ملی۔" }, { status: 404 });

    await deleteFile(book.pdfUrl);
    if (book.coverUrl) await deleteFile(book.coverUrl);
    await Book.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/books/:id] failed:", err);
    return NextResponse.json({ error: "کتاب حذف نہیں ہو سکی۔" }, { status: 500 });
  }
}
