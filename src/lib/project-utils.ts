import type { Project } from "./types";
import { withBasePath } from "./base-path";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

export function cleanGalleryEntries(entries: readonly string[]): string[] {
  const seen = new Set<string>();
  const gallery: string[] = [];

  for (const entry of entries) {
    const nextEntry = entry.trim();
    if (!nextEntry || seen.has(nextEntry)) {
      continue;
    }

    seen.add(nextEntry);
    gallery.push(nextEntry);
  }

  return gallery;
}

export function getProjectGallery(project: {
  image?: string | null;
  gallery?: readonly string[] | null;
}): string[] {
  const image = typeof project.image === "string" ? project.image : "";
  const gallery = Array.isArray(project.gallery) ? project.gallery : [];
  return cleanGalleryEntries([image, ...gallery]).map((entry) => withBasePath(entry));
}

export function normalizeProjectPayload(value: unknown): Omit<Project, "id"> | null {
  if (!isRecord(value)) {
    return null;
  }

  const {
    title,
    description,
    image,
    gallery,
    tags,
    category,
    featured,
    accent,
    links,
  } = value;

  if (
    !isString(title) ||
    !isString(description) ||
    !isString(image) ||
    (gallery !== undefined && !isStringArray(gallery)) ||
    !isStringArray(tags) ||
    !isString(category) ||
    typeof featured !== "boolean" ||
    !isString(accent) ||
    !isRecord(links) ||
    !isString(links.live) ||
    !isString(links.github)
  ) {
    return null;
  }

  return {
    title,
    description,
    image,
    gallery: cleanGalleryEntries(gallery ?? []),
    tags,
    category,
    featured,
    accent,
    links: {
      live: links.live,
      github: links.github,
    },
  };
}

export function normalizeProject(value: unknown): Project | null {
  if (!isRecord(value) || typeof value.id !== "number" || !Number.isFinite(value.id)) {
    return null;
  }

  const payload = normalizeProjectPayload(value);
  if (!payload) {
    return null;
  }

  return {
    id: value.id,
    ...payload,
  };
}
