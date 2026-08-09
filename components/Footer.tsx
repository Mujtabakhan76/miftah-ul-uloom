import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="arabic-text text-xl mb-2" style={{ color: "var(--color-gold-light)" }}>
              مفتاح العلوم
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              اسلامی مدارس، علماء اور طلباء کے لیے عربی و اردو کتب کی ایک جامع ڈیجیٹل لائبریری۔
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-white/90">روابط</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/library" className="hover:text-white">کتب خانہ</Link></li>
              <li><Link href="/search" className="hover:text-white">تلاش</Link></li>
              <li><Link href="/admin" className="hover:text-white">ایڈمن</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-white/90">رابطہ</h4>
            <p className="text-sm text-white/70">مزید معلومات کے لیے ادارے سے رابطہ کریں۔</p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 text-xs text-white/50 text-center">
          © {new Date().getFullYear()} مفتاح العلوم — Miftah-ul-Uloom. جملہ حقوق محفوظ ہیں۔
        </div>
      </div>
    </footer>
  );
}
