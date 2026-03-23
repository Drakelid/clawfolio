"use client";

import { cn } from "@/lib/utils";

interface TagProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export default function Tag({ children, color, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-1 text-xs font-mono",
        "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]",
        className
      )}
      style={color ? { borderColor: `${color}33`, color } : undefined}
    >
      {children}
    </span>
  );
}
