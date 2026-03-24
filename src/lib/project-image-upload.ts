import "server-only";

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const PROJECT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "projects");
const PROJECT_UPLOAD_PUBLIC_PATH = "/uploads/projects";
const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function sanitizeBaseName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "project-image";
}

export async function saveProjectImageUpload(file: File, projectTitle?: string): Promise<string> {
  const extension = MIME_TO_EXTENSION[file.type];
  if (!extension) {
    throw new Error("Unsupported image type");
  }

  if (file.size <= 0) {
    throw new Error("Uploaded file is empty");
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error("Image exceeds 8MB limit");
  }

  const baseName = sanitizeBaseName(projectTitle || file.name.replace(/\.[^.]+$/, ""));
  const filename = `${baseName}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${extension}`;
  const filePath = path.join(PROJECT_UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.mkdir(PROJECT_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(filePath, buffer);

  return `${PROJECT_UPLOAD_PUBLIC_PATH}/${filename}`;
}
