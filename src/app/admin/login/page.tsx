"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(withBasePath("/api/admin/auth"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Invalid password");
        return;
      }

      router.replace(withBasePath("/admin/site"));
      router.refresh();
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[var(--accent)]/10 blur-[120px]" />
      <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-[var(--accent-2)]/10 blur-[120px]" />

      <div className="glass relative rounded-3xl border border-[var(--border)] p-6 shadow-2xl shadow-black/10 sm:p-8">
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Protected Area
          </p>
          <h1 className="mt-2 font-mono text-2xl font-bold text-[var(--text-primary)]">
            Clawfolio CMS
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            Sign in to edit site content, projects, and experience entries.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              required
              className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 font-mono text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
              placeholder="Enter admin password"
            />
            {error ? (
              <p className="mt-2 font-mono text-xs text-red-300">{error}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full bg-[var(--accent)] px-4 py-3 font-mono text-sm font-medium text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
