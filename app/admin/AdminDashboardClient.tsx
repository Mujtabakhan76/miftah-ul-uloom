"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Pencil, LogOut, AlertTriangle } from "lucide-react";
import type { BookSummary } from "@/lib/types";

export default function AdminDashboardClient({ initialBooks }: { initialBooks: BookSummary[] }) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b._id !== id));
        setConfirmId(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="urdu-text text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
            ایڈمن ڈیش بورڈ
          </h1>
          <p className="text-sm text-gray-500">{books.length} کتب لائبریری میں موجود ہیں</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/new" className="btn-primary text-sm">
            <Plus size={15} /> نئی کتاب شامل کریں
          </Link>
          <button onClick={logout} className="btn-outline text-sm">
            <LogOut size={15} /> لاگ آؤٹ
          </button>
        </div>
      </div>

      {books.length === 0 ? (
        <p className="rounded-lg border p-10 text-center text-sm text-gray-500" style={{ borderColor: "var(--color-border)" }}>
          ابھی کوئی کتاب شامل نہیں کی گئی۔
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500" style={{ borderColor: "var(--color-border)" }}>
                <th className="p-3 text-right">نام</th>
                <th className="p-3 text-right">مصنف</th>
                <th className="p-3 text-right">زبان</th>
                <th className="p-3 text-right">موضوع</th>
                <th className="p-3 text-right">صفحات</th>
                <th className="p-3 text-right">حالت</th>
                <th className="p-3 text-right">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b._id} className="border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
                  <td className="arabic-text p-3 font-medium" style={{ color: "var(--color-primary)" }}>
                    {b.arabicTitle || b.title}
                  </td>
                  <td className="p-3 text-gray-600">{b.author || "—"}</td>
                  <td className="p-3 text-gray-600">{b.language}</td>
                  <td className="p-3 text-gray-600">{b.category}</td>
                  <td className="p-3 text-gray-600">{b.pageCount}</td>
                  <td className="p-3">
                    {b.isSearchable ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] text-green-700">searchable</span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                        <AlertTriangle size={10} /> OCR درکار
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/${b._id}/edit`} className="rounded p-1.5 hover:bg-gray-100" aria-label="ترمیم">
                        <Pencil size={14} />
                      </Link>
                      <button onClick={() => setConfirmId(b._id)} className="rounded p-1.5 hover:bg-red-50 text-red-600" aria-label="حذف کریں">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <p className="urdu-text mb-5 text-center text-base" style={{ color: "var(--color-primary)" }}>
              کیا آپ واقعی یہ کتاب حذف کرنا چاہتے ہیں؟
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmId(null)} className="btn-outline flex-1 justify-center text-sm">
                منسوخ کریں
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deleting}
                className="flex-1 justify-center rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {deleting ? "..." : "حذف کریں"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
