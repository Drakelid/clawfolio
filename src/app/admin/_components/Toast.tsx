"use client";

import { useEffect } from "react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onDismiss?: () => void;
  className?: string;
}

const toastStyles: Record<
  ToastType,
  { border: string; background: string; accent: string; label: string }
> = {
  success: {
    border: "rgba(16, 185, 129, 0.35)",
    background: "rgba(16, 185, 129, 0.08)",
    accent: "#34d399",
    label: "Success",
  },
  error: {
    border: "rgba(239, 68, 68, 0.35)",
    background: "rgba(239, 68, 68, 0.08)",
    accent: "#f87171",
    label: "Error",
  },
  info: {
    border: "rgba(59, 130, 246, 0.35)",
    background: "rgba(59, 130, 246, 0.08)",
    accent: "#60a5fa",
    label: "Info",
  },
};

export default function Toast({
  message,
  type = "info",
  onDismiss,
  className = "",
}: ToastProps) {
  const styles = toastStyles[type];

  useEffect(() => {
    if (!onDismiss) return;

    const timeout = window.setTimeout(() => {
      onDismiss();
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${className}`}
      style={{
        borderColor: styles.border,
        background: styles.background,
      }}
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{
          color: styles.accent,
          background: "rgba(255, 255, 255, 0.04)",
        }}
        aria-hidden="true"
      >
        {type === "success" ? "OK" : type === "error" ? "!" : "i"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
          {styles.label}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-primary)]">
          {message}
        </p>
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full px-2 py-1 font-mono text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          aria-label="Dismiss toast"
        >
          x
        </button>
      ) : null}
    </div>
  );
}
