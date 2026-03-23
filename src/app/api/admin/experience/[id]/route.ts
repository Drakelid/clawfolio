import { getExperience } from "@/lib/data";
import { validateAdminCookie } from "@/lib/server-auth";
import { writeDataFile } from "@/lib/write";
import type { Experience } from "@/lib/types";

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

function isExperiencePayload(value: unknown): Omit<Experience, "id"> | null {
  if (!isRecord(value)) return null;

  const { role, company, companyUrl, period, description } = value;

  if (
    !isString(role) ||
    !isString(company) ||
    !(companyUrl === null || isString(companyUrl)) ||
    !isString(period) ||
    !isStringArray(description)
  ) {
    return null;
  }

  return {
    role,
    company,
    companyUrl,
    period,
    description,
  };
}

function parseExperienceId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const id = Number.parseInt(value, 10);
  return id > 0 ? id : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const { id: idParam } = await params;
  const id = parseExperienceId(idParam);
  if (id === null) {
    return Response.json({ error: "Invalid experience id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const payload = isExperiencePayload(body);
  if (!payload) {
    return Response.json({ error: "Invalid experience payload" }, { status: 400 });
  }

  const experience = await getExperience();
  const index = experience.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return Response.json({ error: "Experience entry not found" }, { status: 404 });
  }

  const nextEntry = { id, ...payload };
  const nextExperience = [...experience];
  nextExperience[index] = nextEntry;

  await writeDataFile("experience.json", nextExperience);
  return Response.json({ data: nextEntry });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const { id: idParam } = await params;
  const id = parseExperienceId(idParam);
  if (id === null) {
    return Response.json({ error: "Invalid experience id" }, { status: 400 });
  }

  const experience = await getExperience();
  const nextExperience = experience.filter((entry) => entry.id !== id);
  if (nextExperience.length === experience.length) {
    return Response.json({ error: "Experience entry not found" }, { status: 404 });
  }

  await writeDataFile("experience.json", nextExperience);
  return Response.json({ success: true });
}
