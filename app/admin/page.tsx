export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";
import type { BookSummary } from "@/lib/types";
import AdminDashboardClient from "./AdminDashboardClient";

async function getBooks() {
  await connectDB();
  const books = await Book.find({}).select("-pages").sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(books)) as BookSummary[];
}

export default async function AdminPage() {
  let books: BookSummary[] = [];
  let dbError = false;
  try {
    books = await getBooks();
  } catch {
    dbError = true;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {dbError ? (
        <p className="rounded-lg border p-6 text-center text-sm text-amber-700 bg-amber-50" style={{ borderColor: "var(--color-border)" }}>
          ڈیٹا بیس سے رابطہ نہیں ہو سکا۔ .env.local میں MONGODB_URI درست کریں۔
        </p>
      ) : (
        <AdminDashboardClient initialBooks={books} />
      )}
    </div>
  );
}
