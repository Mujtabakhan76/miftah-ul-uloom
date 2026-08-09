export const dynamic = "force-dynamic";
import Link from "next/link";
import { BookOpen, Search, Sparkles } from "lucide-react";
import { connectDB } from "@/lib/db";
import Book from "@/lib/models/Book";
import BookCard from "@/components/BookCard";
import type { BookSummary } from "@/lib/types";

async function getHomeData() {
  await connectDB();
  const [recent, total, arabic, urdu, categories, authors] = await Promise.all([
    Book.find({}).select("-pages").sort({ createdAt: -1 }).limit(8).lean(),
    Book.countDocuments({}),
    Book.countDocuments({ language: "arabic" }),
    Book.countDocuments({ language: "urdu" }),
    Book.distinct("category"),
    Book.distinct("author"),
  ]);
  return {
    recent: JSON.parse(JSON.stringify(recent)) as BookSummary[],
    stats: {
      total,
      arabic,
      urdu,
      categories: categories.length,
      authors: authors.filter(Boolean).length,
    },
  };
}

export default async function HomePage() {
  let recent: BookSummary[] = [];
  let stats = { total: 0, arabic: 0, urdu: 0, categories: 0, authors: 0 };
  let dbError = false;

  try {
    const data = await getHomeData();
    recent = data.recent;
    stats = data.stats;
  } catch {
    dbError = true;
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "var(--color-primary)" }}>
        <div className="islamic-pattern-bg absolute inset-0" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center text-white">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-gold)" }}>
            <BookOpen size={28} />
          </div>
          <h1 className="arabic-text text-4xl sm:text-6xl font-bold mb-3" style={{ color: "var(--color-gold-light)" }}>
            مفتاح العلوم
          </h1>
          <p className="text-sm tracking-[0.3em] text-white/60 mb-6">MIFTAH-UL-ULOOM</p>
          <p className="urdu-text text-xl sm:text-2xl mb-2 text-white/90">
            اسلامی کتب کے مطالعہ اور تحقیق کے لیے ایک جدید ڈیجیٹل لائبریری
          </p>
          <p className="arabic-text text-base sm:text-lg text-white/70 mb-10">
            مكتبة إسلامية رقمية للبحث والقراءة
          </p>

          <form action="/search" className="mx-auto flex max-w-xl items-center gap-2 rounded-full bg-white/95 p-1.5 shadow-lg">
            <input
              name="q"
              type="text"
              placeholder="کتاب یا عبارت تلاش کریں"
              className="arabic-text flex-1 rounded-full bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-none"
            />
            <button type="submit" className="btn-gold text-sm">
              <Search size={15} /> تلاش کریں
            </button>
          </form>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: "var(--color-border)" }}>
          <Stat label="کل کتب" value={stats.total} />
          <Stat label="عربی کتب" value={stats.arabic} />
          <Stat label="اردو کتب" value={stats.urdu} />
          <Stat label="موضوعات" value={stats.categories} />
          <Stat label="مصنفین" value={stats.authors} />
        </div>
      </section>

      {/* Intro */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Sparkles className="mx-auto mb-4" style={{ color: "var(--color-gold)" }} size={22} />
        <h2 className="urdu-text text-2xl font-semibold mb-3" style={{ color: "var(--color-primary)" }}>
          مفتاح العلوم کیا ہے؟
        </h2>
        <p className="urdu-text text-gray-600 leading-loose">
          مفتاح العلوم ایک جدید ڈیجیٹل لائبریری ہے جو مدارس، علماء اور طلباء کو عربی اور اردو
          اسلامی کتب تک آسان رسائی فراہم کرتی ہے۔ کتاب کے اندر یا مکمل لائبریری میں تلاش، اعراب
          کے ساتھ یا بغیر اعراب متن، اور نتائج کو محفوظ کرنے کی سہولت دستیاب ہے۔
        </p>
      </section>

      {/* Recent Books */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="urdu-text text-xl font-semibold" style={{ color: "var(--color-primary)" }}>
            حال ہی میں شامل کی گئی کتب
          </h2>
          <Link href="/library" className="text-sm font-medium" style={{ color: "var(--color-gold)" }}>
            تمام کتابیں دیکھیں ←
          </Link>
        </div>

        {dbError && (
          <p className="rounded-lg border p-4 text-sm text-amber-700 bg-amber-50" style={{ borderColor: "var(--color-border)" }}>
            ڈیٹا بیس سے رابطہ نہیں ہو سکا۔ .env.local میں MONGODB_URI درست کریں۔
          </p>
        )}
        {!dbError && recent.length === 0 && (
          <p className="rounded-lg border p-8 text-center text-sm text-gray-500" style={{ borderColor: "var(--color-border)" }}>
            ابھی کوئی کتاب شامل نہیں کی گئی۔{" "}
            <Link href="/admin" className="font-medium" style={{ color: "var(--color-gold)" }}>
              نئی کتاب شامل کریں
            </Link>
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recent.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center py-2">
      <div className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
