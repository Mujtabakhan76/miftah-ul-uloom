import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="arabic-text text-5xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
        ٤٠٤
      </h1>
      <p className="urdu-text text-lg text-gray-600 mb-6">مطلوبہ صفحہ نہیں ملا۔</p>
      <Link href="/" className="btn-primary text-sm">
        ہوم پیج پر واپس جائیں
      </Link>
    </div>
  );
}
