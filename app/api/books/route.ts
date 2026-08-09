import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";
import { getAdminSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { extractPdfText, buildIndexedPages } from "@/lib/pdf";
import { extractDocxText, buildIndexedDocxPages } from "@/lib/docx-extract";

const PDF_TYPE = "application/pdf";
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_SIZE = 200 * 1024 * 1024; // 200MB

// GET /api/books — public library listing with filters + pagination
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language"); // arabic | urdu | mixed
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "recent"; // recent | alphabetical
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(48, parseInt(searchParams.get("limit") || "24", 10));

    const filter: Record<string, unknown> = {};
    if (language) filter.language = language;
    if (category) filter.category = category;

    const sortSpec: Record<string, 1 | -1> =
      sort === "alphabetical" ? { title: 1 } : { createdAt: -1 };

    const [books, total] = await Promise.all([
      Book.find(filter)
        .select("-pages") // never ship full page text in list views
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Book.countDocuments(filter),
    ]);

    return NextResponse.json({
      books,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/books] failed:", err);
    return NextResponse.json({ error: "کتب لوڈ نہیں ہو سکیں۔" }, { status: 500 });
  }
}

// POST /api/books — admin only: upload PDF or Word file + cover, extract & index text, create record
export async function POST(req: NextRequest) {
  // Every branch below returns NextResponse.json — nothing should ever throw
  // past this point uncaught, because an uncaught error becomes an HTML error
  // page, which the admin form can't parse as JSON and shows as a blank/generic error.
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "غیر مجاز رسائی۔ دوبارہ لاگ ان کریں۔" }, { status: 401 });
    }

    await connectDB();

    const form = await req.formData();
    const title = String(form.get("title") || "").trim();
    const arabicTitle = String(form.get("arabicTitle") || "").trim();
    const urduTitle = String(form.get("urduTitle") || "").trim();
    const author = String(form.get("author") || "").trim();
    const language = String(form.get("language") || "arabic") as "arabic" | "urdu" | "mixed";
    const category = String(form.get("category") || "دیگر").trim();
    const description = String(form.get("description") || "").trim();
    const keywords = String(form.get("keywords") || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const tags = String(form.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const bookFile = form.get("pdf") as File | null; // field name kept as "pdf" for form/back-compat; accepts PDF or DOCX
    const coverFile = form.get("cover") as File | null;

    if (!title || !bookFile) {
      return NextResponse.json({ error: "کتاب کا نام اور فائل درکار ہے۔" }, { status: 400 });
    }

    const isPdf = bookFile.type === PDF_TYPE || bookFile.name.toLowerCase().endsWith(".pdf");
    const isDocx =
      bookFile.type === DOCX_TYPE || bookFile.name.toLowerCase().endsWith(".docx");

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: "صرف PDF یا Word (.docx) فائل اپلوڈ کریں۔" },
        { status: 400 }
      );
    }
    if (bookFile.size > MAX_SIZE) {
      return NextResponse.json({ error: "فائل کا سائز بہت بڑا ہے۔ (max 200MB)" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await bookFile.arrayBuffer());

    // 1. Extract + normalize text (never modifies the original file's bytes)
    let pageCount: number;
    let isSearchable: boolean;
    let indexedPages: ReturnType<typeof buildIndexedPages>;
    let warning: string | undefined;

    try {
      if (isPdf) {
        const extraction = await extractPdfText(fileBuffer);
        pageCount = extraction.pageCount;
        isSearchable = extraction.isSearchable;
        indexedPages = buildIndexedPages(extraction.pages);
        if (extraction.failedPages.length > 0) {
          warning = `کچھ صفحات (${extraction.failedPages.join(", ")}) سے متن نہیں نکالا جا سکا، باقی کتاب محفوظ ہو گئی ہے۔`;
        }
      } else {
        const extraction = await extractDocxText(fileBuffer);
        pageCount = extraction.pageCount;
        isSearchable = extraction.isSearchable;
        indexedPages = buildIndexedDocxPages(extraction.pages);
      }
    } catch (err) {
      console.error("[POST /api/books] extraction failed:", err);
      const detail = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          error: "فائل پروسیس نہیں ہو سکی۔ فائل خراب ہو سکتی ہے۔",
          details: detail,
        },
        { status: 422 }
      );
    }

    // 2. Store original file (untouched) + optional cover image
    let fileUrl: string;
    let coverUrl: string | undefined;
    try {
      fileUrl = await uploadFile(fileBuffer, bookFile.name, isPdf ? PDF_TYPE : DOCX_TYPE);
      if (coverFile && coverFile.size > 0) {
        const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
        coverUrl = await uploadFile(coverBuffer, coverFile.name, coverFile.type);
      }
    } catch (err) {
      console.error("[POST /api/books] storage upload failed:", err);
      const detail = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          error: "فائل اسٹوریج میں محفوظ نہیں ہو سکی۔ Vercel Blob سیٹ اپ چیک کریں۔",
          details: detail,
        },
        { status: 500 }
      );
    }

    // 3. Create the database record
    try {
      const book = await Book.create({
        title,
        arabicTitle,
        urduTitle,
        author,
        language,
        category,
        description,
        keywords,
        tags,
        coverUrl,
        pdfUrl: fileUrl,
        fileType: isPdf ? "pdf" : "docx",
        pageCount,
        isSearchable,
        pages: indexedPages,
      });

      return NextResponse.json(
        {
          book: { ...book.toObject(), pages: undefined },
          warning:
            warning ||
            (isSearchable
              ? undefined
              : "یہ فائل searchable نہیں ہے۔ OCR کی ضرورت ہو سکتی ہے۔"),
        },
        { status: 201 }
      );
    } catch (err) {
      console.error("[POST /api/books] database save failed:", err);
      const detail = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: "کتاب ڈیٹا بیس میں محفوظ نہیں ہو سکی۔", details: detail },
        { status: 500 }
      );
    }
  } catch (err) {
    // Absolute last resort — should be unreachable given the try/catches above,
    // but guarantees the client always gets JSON, never a raw error page.
    console.error("[POST /api/books] unexpected failure:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔", details: detail },
      { status: 500 }
    );
  }
}
