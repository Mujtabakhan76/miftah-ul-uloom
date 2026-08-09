import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";
import { normalizeForSearch, makeSnippet } from "@/lib/arabic";

// GET /api/search?q=...&mode=books|content
//   mode=books   -> کتابوں کے نام سے تلاش (search titles/author/category/keywords)
//   mode=content -> تمام کتابوں میں تلاش   (search inside every indexed book)
export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const mode = searchParams.get("mode") === "content" ? "content" : "books";

  if (!q) return NextResponse.json({ mode, query: q, results: [] });

  if (mode === "books") {
    const regex = new RegExp(escapeRegex(q), "i");
    const normalizedQuery = normalizeForSearch(q);
    const normalizedRegex = new RegExp(escapeRegex(normalizedQuery), "i");

    const books = await Book.find({
      $or: [
        { title: regex },
        { arabicTitle: regex },
        { urduTitle: regex },
        { author: regex },
        { category: regex },
        { keywords: regex },
        { tags: regex },
      ],
    })
      .select("-pages")
      .limit(50)
      .lean();

    // Fallback: normalized match for diacritic-typed Arabic titles the regex above might miss
    const extra = books.length
      ? []
      : await Book.find({}).select("-pages").limit(300).lean().then((all) =>
          all.filter(
            (b) =>
              normalizedRegex.test(normalizeForSearch(b.arabicTitle || "")) ||
              normalizedRegex.test(normalizeForSearch(b.title || ""))
          )
        );

    return NextResponse.json({ mode, query: q, results: books.length ? books : extra });
  }

  // mode = content: search every book's normalized page text via aggregation
  const normalizedQuery = normalizeForSearch(q);
  if (!normalizedQuery) return NextResponse.json({ mode, query: q, results: [] });

  const pipeline = [
    { $unwind: "$pages" },
    { $match: { "pages.normalizedText": { $regex: escapeRegex(normalizedQuery), $options: "i" } } },
    {
      $project: {
        bookId: "$_id",
        title: 1,
        arabicTitle: 1,
        urduTitle: 1,
        author: 1,
        pageNumber: "$pages.pageNumber",
        text: "$pages.text",
      },
    },
    { $limit: 200 },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = await Book.aggregate(pipeline);

  const results = rows.map((r) => ({
    bookId: String(r.bookId),
    title: r.title,
    arabicTitle: r.arabicTitle,
    urduTitle: r.urduTitle,
    author: r.author,
    pageNumber: r.pageNumber,
    snippet: makeSnippet(r.text, q),
  }));

  return NextResponse.json({ mode, query: q, resultCount: results.length, results });
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
