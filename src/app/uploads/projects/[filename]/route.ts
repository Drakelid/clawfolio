import fs from "fs/promises";
import path from "path";

const PROJECT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "projects");

const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function resolveContentType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  return CONTENT_TYPES[extension] ?? "application/octet-stream";
}

function isSafeFilename(filename: string): boolean {
  return /^[a-z0-9][a-z0-9.-]*$/i.test(filename) && !filename.includes("..");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!isSafeFilename(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(PROJECT_UPLOAD_DIR, filename);

  try {
    const file = await fs.readFile(filePath);

    return new Response(file, {
      headers: {
        "Content-Type": resolveContentType(filename),
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return new Response("Not found", { status: 404 });
    }

    throw error;
  }
}
