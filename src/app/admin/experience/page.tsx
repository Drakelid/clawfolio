"use client";

import { useEffect, useState } from "react";
import Toast from "../_components/Toast";
import type { Experience } from "@/lib/types";

type ToastState = { message: string; type: "success" | "error" } | null;

const EMPTY_EXPERIENCE: Omit<Experience, "id"> = {
  role: "",
  company: "",
  companyUrl: null,
  period: "",
  description: [""],
};

const inputClass =
  "w-full rounded-lg border px-3 py-2 font-mono text-sm bg-transparent outline-none transition-colors focus:border-[var(--accent)]";
const inputStyle = { borderColor: "var(--border)", color: "var(--text-primary)" };
const labelClass = "block font-mono text-xs mb-1";
const labelStyle = { color: "var(--text-muted)" };

function cloneExperience(entry: Experience): Experience {
  return {
    ...entry,
    description: [...entry.description],
  };
}

function normalizeExperience(raw: unknown): Experience[] {
  const payload = raw && typeof raw === "object" && "data" in raw ? (raw as { data: unknown }).data : raw;
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry) => {
    const value = entry as Partial<Experience>;
    return {
      id: Number(value.id ?? 0),
      role: value.role ?? "",
      company: value.company ?? "",
      companyUrl: value.companyUrl ?? null,
      period: value.period ?? "",
      description: Array.isArray(value.description)
        ? value.description.filter((line): line is string => typeof line === "string")
        : [],
    };
  });
}

export default function ExperienceAdminPage() {
  const [entries, setEntries] = useState<Experience[]>([]);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExperience() {
      try {
        const res = await fetch("/api/admin/experience", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error((json && typeof json === "object" && "error" in json && String(json.error)) || "Failed to load experience");
        }

        if (!cancelled) {
          setEntries(normalizeExperience(json));
        }
      } catch (error) {
        if (!cancelled) {
          setToast({
            message: error instanceof Error ? error.message : "Failed to load experience",
            type: "error",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadExperience();

    return () => {
      cancelled = true;
    };
  }, []);

  const openNew = () => {
    setEditing(cloneExperience({ id: 0, ...EMPTY_EXPERIENCE }));
    setIsNew(true);
  };

  const openEdit = (entry: Experience) => {
    setEditing(cloneExperience(entry));
    setIsNew(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!editing) return;

    setSaving(true);
    try {
      const url = isNew ? "/api/admin/experience" : `/api/admin/experience/${editing.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error((json && typeof json === "object" && "error" in json && String(json.error)) || "Failed to save experience");
      }

      const refreshed = await fetch("/api/admin/experience", { cache: "no-store" }).then((response) => response.json());
      setEntries(normalizeExperience(refreshed));
      setEditing(null);
      setIsNew(false);
      setToast({ message: isNew ? "Entry created" : "Entry saved", type: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to save experience",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this entry?")) return;

    try {
      const res = await fetch(`/api/admin/experience/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((json && typeof json === "object" && "error" in json && String(json.error)) || "Failed to delete experience");
      }

      setEntries((current) => current.filter((entry) => entry.id !== id));
      setToast({ message: "Entry deleted", type: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to delete experience",
        type: "error",
      });
    }
  };

  const updateEntry = <K extends keyof Experience>(key: K, value: Experience[K]) => {
    setEditing((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateDescription = (index: number, value: string) => {
    setEditing((current) => {
      if (!current) return current;
      const description = [...current.description];
      description[index] = value;
      return { ...current, description };
    });
  };

  const addBullet = () => {
    setEditing((current) => (current ? { ...current, description: [...current.description, ""] } : current));
  };

  const removeBullet = (index: number) => {
    setEditing((current) => {
      if (!current || current.description.length <= 1) return current;
      return {
        ...current,
        description: current.description.filter((_, descriptionIndex) => descriptionIndex !== index),
      };
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 font-mono text-sm text-[var(--text-muted)]">
        Loading experience...
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

        <div className="flex items-center gap-4">
          <h1 className="font-mono text-2xl font-bold text-[var(--text-primary)]">{isNew ? "Add Entry" : "Edit Entry"}</h1>
          <button type="button" onClick={cancelEdit} className="font-mono text-sm text-[var(--text-muted)]">
            Back
          </button>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass} style={labelStyle}>
                Role
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={editing.role}
                onChange={(e) => updateEntry("role", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Company
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={editing.company}
                onChange={(e) => updateEntry("company", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass} style={labelStyle}>
                Company URL
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={editing.companyUrl ?? ""}
                onChange={(e) => updateEntry("companyUrl", e.target.value || null)}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Period
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={editing.period}
                onChange={(e) => updateEntry("period", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              Description Bullets
            </label>
            <div className="space-y-2">
              {editing.description.map((bullet, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    style={inputStyle}
                    value={bullet}
                    onChange={(e) => updateDescription(index, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(index)}
                    disabled={editing.description.length <= 1}
                    className="rounded-lg border border-red-500/20 px-3 font-mono text-xs text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addBullet}
              className="mt-3 font-mono text-xs text-[var(--accent)]"
            >
              + Add bullet
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full px-6 py-2 font-mono text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-[var(--border)] px-6 py-2 font-mono text-sm text-[var(--text-muted)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Experience</p>
          <h1 className="mt-2 font-mono text-2xl font-bold text-[var(--text-primary)]">Career Timeline</h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-full px-5 py-2 font-mono text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + Add Entry
        </button>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-mono text-base font-bold text-[var(--text-primary)]">{entry.role}</h3>
                <span className="font-mono text-xs text-[var(--accent)]">{entry.period}</span>
              </div>
              <p className="mt-1 font-mono text-sm text-[var(--text-muted)]">
                {entry.company}
                {entry.companyUrl ? ` · ${entry.companyUrl}` : ""}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {entry.description[0] || "No description"}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(entry)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--text-muted)]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                className="rounded-lg border border-red-500/20 px-3 py-1.5 font-mono text-xs text-red-400"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
