import BookForm from "@/components/BookForm";

export default function NewBookPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="urdu-text mb-6 text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
        نئی کتاب شامل کریں
      </h1>
      <BookForm />
    </div>
  );
}
