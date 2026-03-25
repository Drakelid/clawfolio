"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

const navItems = [
  { href: "/admin/site", label: "Site", hint: "Copy and metadata" },
  { href: "/admin/projects", label: "Projects", hint: "Portfolio work" },
  { href: "/admin/experience", label: "Experience", hint: "Career timeline" },
];

function AdminBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[var(--accent)]/10 blur-[120px]" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[var(--accent-2)]/10 blur-[140px]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 72%)",
        }}
      />
    </div>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === "/admin/login";

  const handleLogout = async () => {
    await fetch(withBasePath("/api/admin/logout"), { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  if (isLoginRoute) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <AdminBackdrop />
        <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <AdminBackdrop />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-4 lg:flex-row lg:p-6">
        <aside className="glass flex w-full flex-col rounded-3xl border border-[var(--border)] p-5 shadow-2xl shadow-black/10 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-80">
          <div className="mb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
              Clawfolio CMS
            </p>
            <h1 className="mt-2 font-mono text-2xl font-bold text-[var(--text-primary)]">
              Admin Console
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
              Update site copy, projects, and experience without touching code.
            </p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block rounded-2xl border px-4 py-3 transition-colors duration-200"
                  style={{
                    borderColor: active ? "var(--accent)" : "transparent",
                    background: active ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-base font-semibold text-[var(--text-primary)]">
                      {item.label}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                      Open
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {item.hint}
                  </p>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 pt-6">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 font-mono text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            >
              <span>View Site</span>
              <span aria-hidden="true">-&gt;</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 font-mono text-sm text-[var(--text-muted)] transition-colors hover:border-red-500/40 hover:text-red-300"
            >
              <span>Logout</span>
              <span aria-hidden="true">&lt;-</span>
            </button>
          </div>
        </aside>

        <main className="glass min-h-[calc(100vh-2rem)] flex-1 rounded-3xl border border-[var(--border)] p-5 shadow-2xl shadow-black/10 sm:p-7 lg:min-h-[calc(100vh-3rem)] lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
