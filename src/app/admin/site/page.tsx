"use client";

import { useEffect, useState } from "react";
import Toast from "../_components/Toast";
import type { SiteData, Stat } from "@/lib/types";

type TabKey = "hero" | "about" | "contact";

const TAB_LABELS: Array<{ key: TabKey; label: string }> = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "About" },
  { key: "contact", label: "Contact" },
];

const EMPTY_DATA: SiteData = {
  meta: {
    title: "",
    description: "",
    url: "",
  },
  hero: {
    name: "",
    role: "",
    taglines: ["", "", ""],
    coordinates: { lat: "", lng: "" },
    socials: { github: "", linkedin: "", twitter: "" },
  },
  about: {
    title: "",
    bio: ["", "", ""],
    stats: [
      { label: "", value: 0, suffix: "" },
      { label: "", value: 0, suffix: "" },
      { label: "", value: 0, suffix: "" },
    ],
    techStack: {
      Frontend: [],
      Backend: [],
      Tools: [],
    },
  },
  contact: {
    email: "",
  },
};

const inputClass =
  "w-full rounded-lg border px-3 py-2 font-mono text-sm bg-transparent outline-none transition-colors focus:border-[var(--accent)]";
const inputStyle = { borderColor: "var(--border)", color: "var(--text-primary)" };
const labelClass = "block font-mono text-xs mb-1";
const labelStyle = { color: "var(--text-muted)" };

function cloneData(data: SiteData): SiteData {
  return {
    meta: { ...data.meta },
    hero: {
      ...data.hero,
      taglines: [...data.hero.taglines],
      coordinates: { ...data.hero.coordinates },
      socials: { ...data.hero.socials },
    },
    about: {
      ...data.about,
      title: data.about.title,
      bio: [...data.about.bio],
      stats: data.about.stats.map((stat) => ({ ...stat })),
      techStack: Object.fromEntries(
        Object.entries(data.about.techStack).map(([key, value]) => [key, [...value]])
      ),
    },
    contact: { ...data.contact },
  };
}

function normalizeSiteData(raw: unknown): SiteData {
  const payload = raw && typeof raw === "object" && "data" in raw ? (raw as { data: unknown }).data : raw;
  if (!payload || typeof payload !== "object") {
    return cloneData(EMPTY_DATA);
  }

  const data = payload as Partial<SiteData>;

  return {
    meta: {
      title: data.meta?.title ?? "",
      description: data.meta?.description ?? "",
      url: data.meta?.url ?? "",
    },
    hero: {
      name: data.hero?.name ?? "",
      role: data.hero?.role ?? "",
      taglines: Array.isArray(data.hero?.taglines) ? [...data.hero!.taglines] : ["", "", ""],
      coordinates: {
        lat: data.hero?.coordinates?.lat ?? "",
        lng: data.hero?.coordinates?.lng ?? "",
      },
      socials: {
        github: data.hero?.socials?.github ?? "",
        linkedin: data.hero?.socials?.linkedin ?? "",
        twitter: data.hero?.socials?.twitter ?? "",
      },
    },
    about: {
      title: data.about?.title ?? "",
      bio: Array.isArray(data.about?.bio) ? [...data.about!.bio] : ["", "", ""],
      stats: Array.isArray(data.about?.stats)
        ? data.about!.stats.map((stat) => ({
            label: stat?.label ?? "",
            value: typeof stat?.value === "number" ? stat.value : Number(stat?.value ?? 0),
            suffix: stat?.suffix ?? "",
          }))
        : cloneData(EMPTY_DATA).about.stats,
      techStack: {
        Frontend: Array.isArray(data.about?.techStack?.Frontend)
          ? [...data.about!.techStack!.Frontend]
          : [],
        Backend: Array.isArray(data.about?.techStack?.Backend)
          ? [...data.about!.techStack!.Backend]
          : [],
        Tools: Array.isArray(data.about?.techStack?.Tools)
          ? [...data.about!.techStack!.Tools]
          : [],
      },
    },
    contact: {
      email: data.contact?.email ?? "",
    },
  };
}

function toCommaList(values: string[]): string {
  return values.join(", ");
}

function fromCommaList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function SiteAdminPage() {
  const [data, setData] = useState<SiteData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSite() {
      try {
        const res = await fetch("/api/admin/site", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error((json && typeof json === "object" && "error" in json && String(json.error)) || "Failed to load site data");
        }

        if (!cancelled) {
          setData(normalizeSiteData(json));
        }
      } catch (error) {
        if (!cancelled) {
          setToast({
            message: error instanceof Error ? error.message : "Failed to load site data",
            type: "error",
          });
          setData(cloneData(EMPTY_DATA));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSite();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateMeta = (key: keyof SiteData["meta"], value: string) => {
    setData((current) => (current ? { ...current, meta: { ...current.meta, [key]: value } } : current));
  };

  const updateHero = (key: keyof SiteData["hero"], value: string) => {
    setData((current) => (current ? { ...current, hero: { ...current.hero, [key]: value } } : current));
  };

  const updateHeroTagline = (index: number, value: string) => {
    setData((current) => {
      if (!current) return current;
      const taglines = [...current.hero.taglines];
      taglines[index] = value;
      return { ...current, hero: { ...current.hero, taglines } };
    });
  };

  const updateCoordinates = (key: keyof SiteData["hero"]["coordinates"], value: string) => {
    setData((current) =>
      current ? { ...current, hero: { ...current.hero, coordinates: { ...current.hero.coordinates, [key]: value } } } : current
    );
  };

  const updateSocial = (key: keyof SiteData["hero"]["socials"], value: string) => {
    setData((current) =>
      current ? { ...current, hero: { ...current.hero, socials: { ...current.hero.socials, [key]: value } } } : current
    );
  };

  const updateBio = (index: number, value: string) => {
    setData((current) => {
      if (!current) return current;
      const bio = [...current.about.bio];
      bio[index] = value;
      return { ...current, about: { ...current.about, bio } };
    });
  };

  const updateAboutTitle = (value: string) => {
    setData((current) =>
      current ? { ...current, about: { ...current.about, title: value } } : current
    );
  };

  const updateStat = (index: number, key: keyof Stat, value: string) => {
    setData((current) => {
      if (!current) return current;
      const stats = current.about.stats.map((stat, statIndex) => {
        if (statIndex !== index) return stat;
        if (key === "value") {
          return { ...stat, value: Number(value) || 0 };
        }
        return { ...stat, [key]: value };
      });
      return { ...current, about: { ...current.about, stats } };
    });
  };

  const updateTechStack = (key: keyof SiteData["about"]["techStack"], value: string) => {
    setData((current) =>
      current ? { ...current, about: { ...current.about, techStack: { ...current.about.techStack, [key]: fromCommaList(value) } } } : current
    );
  };

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error((json && typeof json === "object" && "error" in json && String(json.error)) || "Failed to save site data");
      }

      const refreshed = await fetch("/api/admin/site", { cache: "no-store" }).then((response) => response.json());
      setData(normalizeSiteData(refreshed));
      setToast({ message: "Site content saved", type: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to save site data",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 font-mono text-sm text-[var(--text-muted)]">
        Loading site content...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Site Editor</p>
          <h1 className="mt-2 font-mono text-2xl font-bold text-[var(--text-primary)]">Portfolio Content</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
            Edit the public site copy without touching code. Changes are written to JSON and revalidated immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full px-5 py-2 font-mono text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClass} style={labelStyle}>
              Meta Title
            </label>
            <input
              className={inputClass}
              style={inputStyle}
              value={data.meta.title}
              onChange={(e) => updateMeta("title", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass} style={labelStyle}>
              Meta Description
            </label>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              style={inputStyle}
              value={data.meta.description}
              onChange={(e) => updateMeta("description", e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <label className={labelClass} style={labelStyle}>
              Canonical URL
            </label>
            <input
              className={inputClass}
              style={inputStyle}
              value={data.meta.url}
              onChange={(e) => updateMeta("url", e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {TAB_LABELS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="rounded-full px-4 py-2 font-mono text-xs transition-colors"
            style={{
              background: activeTab === tab.key ? "var(--accent)" : "var(--surface)",
              color: activeTab === tab.key ? "white" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "hero" && (
        <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass} style={labelStyle}>
                Name
              </label>
              <input className={inputClass} style={inputStyle} value={data.hero.name} onChange={(e) => updateHero("name", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Role
              </label>
              <input className={inputClass} style={inputStyle} value={data.hero.role} onChange={(e) => updateHero("role", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {data.hero.taglines.map((tagline, index) => (
              <div key={index}>
                <label className={labelClass} style={labelStyle}>
                  Tagline {index + 1}
                </label>
                <input
                  className={inputClass}
                  style={inputStyle}
                  value={tagline}
                  onChange={(e) => updateHeroTagline(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass} style={labelStyle}>
                Latitude
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={data.hero.coordinates.lat}
                onChange={(e) => updateCoordinates("lat", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Longitude
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={data.hero.coordinates.lng}
                onChange={(e) => updateCoordinates("lng", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass} style={labelStyle}>
                GitHub
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={data.hero.socials.github}
                onChange={(e) => updateSocial("github", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                LinkedIn
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={data.hero.socials.linkedin}
                onChange={(e) => updateSocial("linkedin", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Twitter
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={data.hero.socials.twitter}
                onChange={(e) => updateSocial("twitter", e.target.value)}
              />
            </div>
          </div>
        </section>
      )}

      {activeTab === "about" && (
        <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <div>
            <label className={labelClass} style={labelStyle}>
              Section Heading
            </label>
            <input
              className={inputClass}
              style={inputStyle}
              value={data.about.title}
              onChange={(e) => updateAboutTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {data.about.bio.map((paragraph, index) => (
              <div key={index}>
                <label className={labelClass} style={labelStyle}>
                  Bio Paragraph {index + 1}
                </label>
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  style={inputStyle}
                  value={paragraph}
                  onChange={(e) => updateBio(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {data.about.stats.map((stat, index) => (
              <div key={`${stat.label}-${index}`} className="rounded-xl border border-[var(--border)] p-4">
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Stat {index + 1}</p>
                <label className={labelClass} style={labelStyle}>
                  Label
                </label>
                <input
                  className={`${inputClass} mb-3`}
                  style={inputStyle}
                  value={stat.label}
                  onChange={(e) => updateStat(index, "label", e.target.value)}
                />
                <label className={labelClass} style={labelStyle}>
                  Value
                </label>
                <input
                  className={`${inputClass} mb-3`}
                  style={inputStyle}
                  type="number"
                  value={stat.value}
                  onChange={(e) => updateStat(index, "value", e.target.value)}
                />
                <label className={labelClass} style={labelStyle}>
                  Suffix
                </label>
                <input
                  className={inputClass}
                  style={inputStyle}
                  value={stat.suffix}
                  onChange={(e) => updateStat(index, "suffix", e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass} style={labelStyle}>
                Frontend Skills
              </label>
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                style={inputStyle}
                value={toCommaList(data.about.techStack.Frontend)}
                onChange={(e) => updateTechStack("Frontend", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Backend Skills
              </label>
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                style={inputStyle}
                value={toCommaList(data.about.techStack.Backend)}
                onChange={(e) => updateTechStack("Backend", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Tools
              </label>
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                style={inputStyle}
                value={toCommaList(data.about.techStack.Tools)}
                onChange={(e) => updateTechStack("Tools", e.target.value)}
              />
            </div>
          </div>
        </section>
      )}

      {activeTab === "contact" && (
        <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <div className="max-w-xl">
            <label className={labelClass} style={labelStyle}>
              Contact Email
            </label>
            <input
              className={inputClass}
              style={inputStyle}
              value={data.contact.email}
              onChange={(e) => setData((current) => (current ? { ...current, contact: { email: e.target.value } } : current))}
            />
          </div>
        </section>
      )}
    </div>
  );
}
