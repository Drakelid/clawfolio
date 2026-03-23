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

function isExperience(value: unknown): value is Experience {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isFinite(value.id) &&
    isString(value.role) &&
    isString(value.company) &&
    (value.companyUrl === null || isString(value.companyUrl)) &&
    isString(value.period) &&
    isStringArray(value.description)
  );
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

function nextExperienceId(entries: Experience[]): number {
  return entries.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
}

export async function GET() {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const experience = await getExperience();
  if (!experience.every(isExperience)) {
    return Response.json({ error: "Invalid experience data" }, { status: 500 });
  }

  return Response.json({ data: experience });
}

export async function POST(request: Request) {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const payload = isExperiencePayload(body);
  if (!payload) {
    return Response.json({ error: "Invalid experience payload" }, { status: 400 });
  }

  const experience = await getExperience();
  const nextEntry = { id: nextExperienceId(experience), ...payload };
  const nextExperience = [...experience, nextEntry];

  await writeDataFile("experience.json", nextExperience);
  return Response.json({ data: nextEntry }, { status: 201 });
}
