import { getProjectsUncached } from "@/lib/data";
import { normalizeProject, normalizeProjectPayload } from "@/lib/project-utils";
import { validateAdminCookie } from "@/lib/server-auth";
import { writeDataFile } from "@/lib/write";
import type { Project } from "@/lib/types";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
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
  const payload = normalizeProjectPayload(body);
  if (!payload) {
    return Response.json({ error: "Invalid project payload" }, { status: 400 });
  }

  const rawProjects = await getProjectsUncached();
  const projects = rawProjects
    .map((project) => normalizeProject(project))
    .filter((project): project is Project => project !== null);

  if (projects.length !== rawProjects.length) {
    return Response.json({ error: "Invalid projects data" }, { status: 500 });
  }

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

  const rawProjects = await getProjectsUncached();
  const projects = rawProjects
    .map((project) => normalizeProject(project))
    .filter((project): project is Project => project !== null);

  if (projects.length !== rawProjects.length) {
    return Response.json({ error: "Invalid projects data" }, { status: 500 });
  }

  const nextProjects = projects.filter((project) => project.id !== id);
  if (nextProjects.length === projects.length) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  await writeDataFile("projects.json", nextProjects);
  return Response.json({ success: true });
}
