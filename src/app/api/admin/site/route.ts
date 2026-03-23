import { getSiteData } from "@/lib/data";
import { validateAdminCookie } from "@/lib/server-auth";
import { writeDataFile } from "@/lib/write";
import type { SiteData } from "@/lib/types";

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

function isStat(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.label) &&
    typeof value.value === "number" &&
    Number.isFinite(value.value) &&
    isString(value.suffix)
  );
}

function isSiteData(value: unknown): value is SiteData {
  if (!isRecord(value)) return false;

  const meta = value.meta;
  const hero = value.hero;
  const about = value.about;
  const contact = value.contact;

  return (
    isRecord(meta) &&
    isString(meta.title) &&
    isString(meta.description) &&
    isString(meta.url) &&
    isRecord(hero) &&
    isString(hero.name) &&
    isString(hero.role) &&
    isStringArray(hero.taglines) &&
    isRecord(hero.coordinates) &&
    isString(hero.coordinates.lat) &&
    isString(hero.coordinates.lng) &&
    isRecord(hero.socials) &&
    isString(hero.socials.github) &&
    isString(hero.socials.linkedin) &&
    isString(hero.socials.twitter) &&
    isRecord(about) &&
    isStringArray(about.bio) &&
    about.bio.length === 3 &&
    Array.isArray(about.stats) &&
    about.stats.every(isStat) &&
    isRecord(about.techStack) &&
    Object.values(about.techStack).every(isStringArray) &&
    isRecord(contact) &&
    isString(contact.email)
  );
}

export async function GET() {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const data = await getSiteData();
  return Response.json({ data });
}

export async function PUT(request: Request) {
  if (!(await validateAdminCookie())) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  if (!isSiteData(body)) {
    return Response.json({ error: "Invalid site payload" }, { status: 400 });
  }

  await writeDataFile("site.json", body);
  return Response.json({ data: body });
}
