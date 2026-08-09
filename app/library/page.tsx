export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";
import type { BookSummary } from "@/lib/types";
import LibraryClient from "./LibraryClient";

async function getBooks(searchParams: { [key: string]: string | undefined }) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (searchParams.language) filter.language = searchParams.language;
  if (searchParams.category) filter.category = searchParams.category;

  const sort: Record<string, 1 | -1> =
    searchParams.sort === "alphabetical" ? { title: 1 } : { createdAt: -1 };

  const [books, categories] = await Promise.all([
    Book.find(filter).select("-pages").sort(sort).limit(200).lean(),
    Book.distinct("category"),
  ]);

  return {
    books: JSON.parse(JSON.stringify(books)) as BookSummary[],
    categories: categories as string[],
  };
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  let books: BookSummary[] = [];
  let categories: string[] = [];
  let dbError = false;

  try {
    const data = await getBooks(sp);
    books = data.books;
    categories = data.categories;
  } catch {
    dbError = true;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="urdu-text text-3xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
          کتب خانہ
        </h1>
        <p className="text-sm text-gray-500">Digital Library — تمام دستیاب کتب کی فہرست</p>
      </div>

      {dbError ? (
        <p className="rounded-lg border p-6 text-center text-sm text-amber-700 bg-amber-50" style={{ borderColor: "var(--color-border)" }}>
          ڈیٹا بیس سے رابطہ نہیں ہو سکا۔ .env.local میں MONGODB_URI درست کریں۔
        </p>
      ) : (
        <LibraryClient initialBooks={books} categories={categories} />
      )}
    </div>
  );
}
