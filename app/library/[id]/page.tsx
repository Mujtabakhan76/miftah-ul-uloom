export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";
import ReaderClient from "./ReaderClient";
import type { BookSummary } from "@/lib/types";

async function getBook(id: string) {
  await connectDB();
  const book = await Book.findById(id).select("-pages.text -pages.normalizedText").lean();
  return book ? (JSON.parse(JSON.stringify(book)) as BookSummary) : null;
}

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let book: BookSummary | null = null;

  try {
    book = await getBook(id);
  } catch {
    book = null;
  }

  if (!book) return notFound();

  return <ReaderClient book={book} />;
}
