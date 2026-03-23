import { getProjects } from "@/lib/data";
import { validateAdminCookie } from "@/lib/server-auth";
import { writeDataFile } from "@/lib/write";
import type { Project } from "@/lib/types";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isProjectPayload(value: unknown): Omit<Project, "id"> | null {
  if (!isRecord(value)) return null;

  const {
    title,
    description,
    image,
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

function parseProjectId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const id = Number.parseInt(value, 10);
  return id > 0 ? id : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const { id: idParam } = await params;
  const id = parseProjectId(idParam);
  if (id === null) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const payload = isProjectPayload(body);
  if (!payload) {
    return Response.json({ error: "Invalid project payload" }, { status: 400 });
  }

  const projects = await getProjects();
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const nextProject = { id, ...payload };
  const nextProjects = [...projects];
  nextProjects[index] = nextProject;

  await writeDataFile("projects.json", nextProjects);
  return Response.json({ data: nextProject });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const { id: idParam } = await params;
  const id = parseProjectId(idParam);
  if (id === null) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }

  const projects = await getProjects();
  const nextProjects = projects.filter((project) => project.id !== id);
  if (nextProjects.length === projects.length) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  await writeDataFile("projects.json", nextProjects);
  return Response.json({ success: true });
}
