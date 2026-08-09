"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import type { BookSummary } from "@/lib/types";

const CATEGORIES = [
  "قرآن", "حدیث", "تفسیر", "فقہ", "اصول الفقہ", "عقیدہ",
  "سیرت", "تاریخ اسلام", "عربی", "نحو", "صرف", "ادب", "اردو کتب", "دیگر",
];

type Stage = "idle" | "uploading" | "processing" | "extracting" | "indexing" | "done" | "error";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "",
  uploading: "Uploading...",
  processing: "Processing...",
  extracting: "Extracting text...",
  indexing: "Indexing...",
  done: "Completed",
  error: "",
};

export default function BookForm({ existing }: { existing?: BookSummary }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [warning, setWarning] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setErrorDetail("");
    setWarning("");
    const form = new FormData(e.currentTarget);

    setStage("uploading");
    try {
      const url = existing ? `/api/books/${existing._id}` : "/api/books";
      const method = existing ? "PUT" : "POST";

      setStage("processing");
      await new Promise((r) => setTimeout(r, 150));
      setStage("extracting");

      const res = await fetch(url, { method, body: form });

      setStage("indexing");

      let data: { error?: string; details?: string; warning?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Server returned a non-JSON response (e.g. a crashed function's HTML
        // error page) — surface that plainly instead of a silent generic message.
        setStage("error");
        setError(`سرور نے غیر متوقع جواب دیا (status ${res.status})۔`);
        return;
      }

      if (!res.ok) {
        setStage("error");
        setError(data.error || "کچھ غلط ہو گیا۔");
        if (data.details) setErrorDetail(data.details);
        return;
      }

      if (data.warning) setWarning(data.warning);
      setStage("done");
      router.push("/admin");
      router.refresh();
    } catch {
      setStage("error");
      setError("کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔");
    }
  }

  const busy = stage !== "idle" && stage !== "done" && stage !== "error";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border bg-white p-6" style={{ borderColor: "var(--color-border)" }}>
      <Field label="کتاب کا نام (Title)">
        <input name="title" defaultValue={existing?.title} required className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="عربی نام">
          <input name="arabicTitle" defaultValue={existing?.arabicTitle} className="input arabic-text" />
        </Field>
        <Field label="اردو نام">
          <input name="urduTitle" defaultValue={existing?.urduTitle} className="input urdu-text" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="مصنف">
          <input name="author" defaultValue={existing?.author} className="input" />
        </Field>
        <Field label="زبان">
          <select name="language" defaultValue={existing?.language || "arabic"} className="input">
            <option value="arabic">عربی</option>
            <option value="urdu">اردو</option>
            <option value="mixed">عربی/اردو</option>
          </select>
        </Field>
      </div>
      <Field label="موضوع">
        <select name="category" defaultValue={existing?.category || CATEGORIES[0]} className="input">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="تفصیل">
        <textarea name="description" defaultValue={existing?.description} rows={3} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Keywords (comma separated)">
          <input name="keywords" className="input" placeholder="زكاة, صلاة" />
        </Field>
        <Field label="Tags (comma separated)">
          <input name="tags" className="input" placeholder="فقہ, حنفی" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label={existing ? "PDF یا Word فائل تبدیل کریں (اختیاری)" : "PDF یا Word (.docx) فائل"}>
          <input type="file" name="pdf" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required={!existing} className="input" />
        </Field>
        <Field label="سرورق (Cover)">
          <input type="file" name="cover" accept="image/*" className="input" />
        </Field>
      </div>

      {busy && (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          <Loader2 size={16} className="animate-spin" /> {STAGE_LABEL[stage]}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600">
          <p>{error}</p>
          {errorDetail && <p className="mt-1 text-xs text-red-400 break-all">{errorDetail}</p>}
        </div>
      )}
      {warning && <p className="text-sm text-amber-700">{warning}</p>}

      <button type="submit" disabled={busy} className="btn-primary justify-center py-2.5 text-sm">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
        {existing ? "تبدیلیاں محفوظ کریں" : "کتاب شامل کریں"}
      </button>

      <style jsx global>{`
        .input {
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          width: 100%;
        }
        .input:focus {
          border-color: var(--color-gold);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-gray-500">
      {label}
      {children}
    </label>
  );
}
