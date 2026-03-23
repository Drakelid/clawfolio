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

function isProject(value: unknown): value is Project {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isFinite(value.id) &&
    isString(value.title) &&
    isString(value.description) &&
    isString(value.image) &&
    isStringArray(value.tags) &&
    isString(value.category) &&
    typeof value.featured === "boolean" &&
    isString(value.accent) &&
    isRecord(value.links) &&
    isString(value.links.live) &&
    isString(value.links.github)
  );
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

function nextProjectId(projects: Project[]): number {
  return projects.reduce((max, project) => Math.max(max, project.id), 0) + 1;
}

export async function GET() {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const projects = await getProjects();
  if (!projects.every(isProject)) {
    return Response.json({ error: "Invalid projects data" }, { status: 500 });
  }

  return Response.json({ data: projects });
}

export async function POST(request: Request) {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const payload = isProjectPayload(body);
  if (!payload) {
    return Response.json({ error: "Invalid project payload" }, { status: 400 });
  }

  const projects = await getProjects();
  const nextProject = { id: nextProjectId(projects), ...payload };
  const nextProjects = [...projects, nextProject];

  await writeDataFile("projects.json", nextProjects);
  return Response.json({ data: nextProject }, { status: 201 });
}
