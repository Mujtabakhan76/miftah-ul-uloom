"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "لاگ ان ناکام ہوا۔");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <div className="w-full rounded-2xl border bg-white p-8" style={{ borderColor: "var(--color-border)" }}>
        <div className="mb-6 flex flex-col items-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: "var(--color-primary)" }}>
            <Lock size={20} />
          </span>
          <h1 className="urdu-text text-xl font-semibold" style={{ color: "var(--color-primary)" }}>
            ایڈمن لاگ ان
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="یوزر نیم"
            className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
            style={{ borderColor: "var(--color-border)" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="پاسورڈ"
            className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
            style={{ borderColor: "var(--color-border)" }}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" className="btn-primary mt-2 justify-center py-2.5 text-sm" disabled={loading}>
            {loading ? "..." : "لاگ ان"}
          </button>
        </form>
      </div>
    </div>
  );
}
