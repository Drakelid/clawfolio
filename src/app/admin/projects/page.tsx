"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Toast from "../_components/Toast";
import { withBasePath } from "@/lib/base-path";
import { getProjectGallery, normalizeProject } from "@/lib/project-utils";
import type { Project } from "@/lib/types";

type ToastState = { message: string; type: "success" | "error" } | null;

const CATEGORIES = ["Frontend", "Backend", "Full Stack"];

const EMPTY_PROJECT: Omit<Project, "id"> = {
  title: "",
  description: "",
  image: "",
  gallery: [],
  tags: [],
  category: "Full Stack",
  featured: false,
  accent: "#3B82F6",
  links: {
    live: "",
    github: "",
  },
};

const inputClass =
  "w-full rounded-lg border px-3 py-2 font-mono text-sm bg-transparent outline-none transition-colors focus:border-[var(--accent)]";
const inputStyle = { borderColor: "var(--border)", color: "var(--text-primary)" };
const labelClass = "block font-mono text-xs mb-1";
const labelStyle = { color: "var(--text-muted)" };

function cloneProject(project: Project): Project {
  return {
    ...project,
    gallery: [...project.gallery],
    tags: [...project.tags],
    links: { ...project.links },
  };
}

function normalizeProjects(raw: unknown): Project[] {
  const payload = raw && typeof raw === "object" && "data" in raw ? (raw as { data: unknown }).data : raw;
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((project) => normalizeProject(project))
    .filter((project): project is Project => project !== null);
}

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<"cover" | "gallery" | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const coverUploadInputRef = useRef<HTMLInputElement>(null);
  const galleryUploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const res = await fetch(withBasePath("/api/admin/projects"), { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error((json && typeof json === "object" && "error" in json && String(json.error)) || "Failed to load projects");
        }

        if (!cancelled) {
          setProjects(normalizeProjects(json));
        }
      } catch (error) {
        if (!cancelled) {
          setToast({
            message: error instanceof Error ? error.message : "Failed to load projects",
            type: "error",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const openNew = () => {
    setEditing(cloneProject({ id: 0, ...EMPTY_PROJECT }));
    setIsNew(true);
    setTagInput("");
  };

  const openEdit = (project: Project) => {
    setEditing(cloneProject(project));
    setIsNew(false);
    setTagInput("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setIsNew(false);
    setTagInput("");
  };

  const handleSave = async () => {
    if (!editing) return;

    setSaving(true);
    try {
      const url = isNew
        ? withBasePath("/api/admin/projects")
        : withBasePath(`/api/admin/projects/${editing.id}`);
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error((json && typeof json === "object" && "error" in json && String(json.error)) || "Failed to save project");
      }

      const refreshed = await fetch(withBasePath("/api/admin/projects"), { cache: "no-store" }).then((response) =>
        response.json()
      );
      setProjects(normalizeProjects(refreshed));
      setEditing(null);
      setIsNew(false);
      setTagInput("");
      setToast({ message: isNew ? "Project created" : "Project saved", type: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to save project",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this project?")) return;

    try {
      const res = await fetch(withBasePath(`/api/admin/projects/${id}`), { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((json && typeof json === "object" && "error" in json && String(json.error)) || "Failed to delete project");
      }

      setProjects((current) => current.filter((project) => project.id !== id));
      setToast({ message: "Project deleted", type: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to delete project",
        type: "error",
      });
    }
  };

  const updateProject = <K extends keyof Project>(key: K, value: Project[K]) => {
    setEditing((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateLink = (key: keyof Project["links"], value: string) => {
    setEditing((current) => (current ? { ...current, links: { ...current.links, [key]: value } } : current));
  };

  const addTag = () => {
    if (!editing || !tagInput.trim()) return;

    setEditing({ ...editing, tags: [...editing.tags, tagInput.trim()] });
    setTagInput("");
  };

  const removeTag = (index: number) => {
    if (!editing) return;

    setEditing({ ...editing, tags: editing.tags.filter((_, tagIndex) => tagIndex !== index) });
  };

  const addGalleryImage = () => {
    if (!editing) return;

    setEditing({ ...editing, gallery: [...editing.gallery, ""] });
  };

  const updateGalleryImage = (index: number, value: string) => {
    if (!editing) return;

    setEditing({
      ...editing,
      gallery: editing.gallery.map((image, imageIndex) => (imageIndex === index ? value : image)),
    });
  };

  const removeGalleryImage = (index: number) => {
    if (!editing) return;

    setEditing({
      ...editing,
      gallery: editing.gallery.filter((_, imageIndex) => imageIndex !== index),
    });
  };

  const uploadProjectImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    if (editing?.title.trim()) {
      formData.append("projectTitle", editing.title.trim());
    }

    const res = await fetch(withBasePath("/api/admin/uploads/project-image"), {
      method: "POST",
      body: formData,
    });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error((json && typeof json === "object" && "error" in json && String(json.error)) || "Failed to upload image");
    }

    const path =
      json &&
      typeof json === "object" &&
      "data" in json &&
      json.data &&
      typeof json.data === "object" &&
      "path" in json.data &&
      typeof json.data.path === "string"
        ? json.data.path
        : null;

    if (!path) {
      throw new Error("Upload response did not include an image path");
    }

    return path;
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingTarget("cover");
    try {
      const path = await uploadProjectImage(file);
      setEditing((current) => (current ? { ...current, image: path } : current));
      setToast({ message: "Cover image uploaded", type: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to upload cover image",
        type: "error",
      });
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setUploadingTarget("gallery");
    try {
      const uploadedPaths: string[] = [];
      for (const file of files) {
        uploadedPaths.push(await uploadProjectImage(file));
      }

      setEditing((current) =>
        current ? { ...current, gallery: [...current.gallery, ...uploadedPaths] } : current
      );
      setToast({
        message: `${uploadedPaths.length} gallery image${uploadedPaths.length === 1 ? "" : "s"} uploaded`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to upload gallery images",
        type: "error",
      });
    } finally {
      setUploadingTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 font-mono text-sm text-[var(--text-muted)]">
        Loading projects...
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

        <div className="flex items-center gap-4">
          <h1 className="font-mono text-2xl font-bold text-[var(--text-primary)]">{isNew ? "Add Project" : "Edit Project"}</h1>
          <button type="button" onClick={cancelEdit} className="font-mono text-sm text-[var(--text-muted)]">
            Back
          </button>
        </div>

        <div className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass} style={labelStyle}>
                Title
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={editing.title}
                onChange={(e) => updateProject("title", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Category
              </label>
              <select
                className={inputClass}
                style={inputStyle}
                value={editing.category}
                onChange={(e) => updateProject("category", e.target.value as Project["category"])}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              Description
            </label>
            <textarea
              className={`${inputClass} min-h-32 resize-y`}
              style={inputStyle}
              value={editing.description}
              onChange={(e) => updateProject("description", e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass} style={labelStyle}>
                Cover Image Path
              </label>
              <div className="space-y-2">
                <input
                  className={inputClass}
                  style={inputStyle}
                  value={editing.image}
                  onChange={(e) => updateProject("image", e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => coverUploadInputRef.current?.click()}
                    disabled={uploadingTarget !== null}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 font-mono text-xs text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingTarget === "cover" ? "Uploading..." : "Upload Cover"}
                  </button>
                  <input
                    ref={coverUploadInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  <p className="self-center font-mono text-[11px] text-[var(--text-muted)]">
                    PNG, JPG, WebP, GIF, or AVIF up to 8MB.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Accent Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={editing.accent}
                  onChange={(e) => updateProject("accent", e.target.value)}
                  className="h-10 w-12 rounded border border-[var(--border)] bg-transparent"
                />
                <input
                  className={`${inputClass} flex-1`}
                  style={inputStyle}
                  value={editing.accent}
                  onChange={(e) => updateProject("accent", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <label className={labelClass} style={labelStyle}>
                  Gallery Images
                </label>
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  Add extra preview images for the project gallery or upload them directly here.
                </p>
              </div>
              <button
                type="button"
                onClick={addGalleryImage}
                className="rounded-lg border border-[var(--border)] px-3 py-2 font-mono text-xs text-[var(--text-muted)]"
              >
                + Add Image
              </button>
              <button
                type="button"
                onClick={() => galleryUploadInputRef.current?.click()}
                disabled={uploadingTarget !== null}
                className="rounded-lg border border-[var(--border)] px-3 py-2 font-mono text-xs text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingTarget === "gallery" ? "Uploading..." : "Upload to Gallery"}
              </button>
              <input
                ref={galleryUploadInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                onChange={handleGalleryUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              {editing.gallery.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                  No gallery images yet.
                </div>
              )}

              {editing.gallery.map((image, index) => (
                <div key={`gallery-${index}`} className="flex gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    style={inputStyle}
                    placeholder={`/projects/${editing.title || "project"}-${index + 1}.jpg`}
                    value={image}
                    onChange={(e) => updateGalleryImage(index, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="rounded-lg border border-red-500/20 px-3 py-2 font-mono text-xs text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-mono text-sm text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) => updateProject("featured", e.target.checked)}
              />
              Featured
            </label>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              Tags
            </label>
            <div className="mb-3 flex flex-wrap gap-2">
              {editing.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 font-mono text-xs text-[var(--text-muted)]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="text-red-400"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={`${inputClass} flex-1`}
                style={inputStyle}
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-lg border border-[var(--border)] px-4 py-2 font-mono text-sm text-[var(--text-muted)]"
              >
                Add
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass} style={labelStyle}>
                Live URL
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={editing.links.live}
                onChange={(e) => updateLink("live", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                GitHub URL
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={editing.links.github}
                onChange={(e) => updateLink("github", e.target.value)}
              />
            </div>
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
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Projects</p>
          <h1 className="mt-2 font-mono text-2xl font-bold text-[var(--text-primary)]">Portfolio Projects</h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-full px-5 py-2 font-mono text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + Add Project
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-mono text-base font-bold text-[var(--text-primary)]">{project.title}</h3>
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]"
                    style={{ background: `${project.accent}22`, color: project.accent }}
                  >
                    {project.category}
                  </span>
                  {project.featured && (
                    <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                      Featured
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  {project.description}
                </p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--border)] px-3 py-1 font-mono text-xs text-[var(--text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mb-4 grid gap-2 text-xs font-mono text-[var(--text-muted)]">
              <div>Image: {project.image || "Not set"}</div>
              <div>Previews: {getProjectGallery(project).length}</div>
              <div>Live: {project.links.live || "Not set"}</div>
              <div>GitHub: {project.links.github || "Not set"}</div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(project)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--text-muted)]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(project.id)}
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
