import { getProjectsUncached } from "@/lib/data";
import { normalizeProject, normalizeProjectPayload } from "@/lib/project-utils";
import { validateAdminCookie } from "@/lib/server-auth";
import { writeDataFile } from "@/lib/write";
import type { Project } from "@/lib/types";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function isProject(value: unknown): value is Project {
  return normalizeProject(value) !== null;
}

function nextProjectId(projects: Project[]): number {
  return projects.reduce((max, project) => Math.max(max, project.id), 0) + 1;
}

export async function GET() {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const rawProjects = await getProjectsUncached();
  const projects = rawProjects
    .map((project) => normalizeProject(project))
    .filter((project): project is Project => project !== null);

  if (projects.length !== rawProjects.length || !projects.every(isProject)) {
    return Response.json({ error: "Invalid projects data" }, { status: 500 });
  }

  return Response.json({ data: projects });
}

export async function POST(request: Request) {
  if (!(await validateAdminCookie())) {
    return unauthorized();
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

  const nextProject = { id: nextProjectId(projects), ...payload };
  const nextProjects = [...projects, nextProject];

  await writeDataFile("projects.json", nextProjects);
  return Response.json({ data: nextProject }, { status: 201 });
}
