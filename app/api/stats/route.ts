import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";

export async function GET() {
  await connectDB();

  const [total, arabic, urdu, categories, authors] = await Promise.all([
    Book.countDocuments({}),
    Book.countDocuments({ language: "arabic" }),
    Book.countDocuments({ language: "urdu" }),
    Book.distinct("category"),
    Book.distinct("author"),
  ]);

  return NextResponse.json({
    totalBooks: total,
    arabicBooks: arabic,
    urduBooks: urdu,
    categories: categories.length,
    authors: authors.filter(Boolean).length,
  });
}
