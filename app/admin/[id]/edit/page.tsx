export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";
import BookForm from "@/components/BookForm";
import type { BookSummary } from "@/lib/types";

async function getBook(id: string) {
  await connectDB();
  const book = await Book.findById(id).select("-pages").lean();
  return book ? (JSON.parse(JSON.stringify(book)) as BookSummary) : null;
}

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="urdu-text mb-6 text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
        کتاب میں ترمیم کریں
      </h1>
      <BookForm existing={book} />
    </div>
  );
}
