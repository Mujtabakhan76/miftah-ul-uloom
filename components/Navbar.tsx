"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, BookOpenText, Search } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "ہوم" },
  { href: "/library", label: "کتب خانہ" },
  { href: "/search", label: "تلاش" },
  { href: "/admin", label: "ایڈمن" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <BookOpenText size={18} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="arabic-text text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
                مفتاح العلوم
              </span>
              <span className="text-[11px] tracking-wide text-gray-500">Miftah-ul-Uloom</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-[var(--color-primary)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/search"
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-gray-600 hover:border-[var(--color-gold)] hover:text-[var(--color-primary)] transition-colors"
              style={{ borderColor: "var(--color-border)" }}
            >
              <Search size={14} />
              تلاش کریں
            </Link>
          </div>

          <button
            className="md:hidden rounded-md p-2 text-gray-700"
            onClick={() => setOpen((o) => !o)}
            aria-label="مینو"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <nav className="md:hidden pb-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
