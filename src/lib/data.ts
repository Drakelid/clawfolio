import "server-only";

import fs from "fs/promises";
import path from "path";
import { cacheTag } from "next/cache";
import {
  DEFAULT_EXPERIENCE,
  DEFAULT_PROJECTS,
  DEFAULT_SITE_DATA,
} from "./default-data";
import type { Experience, Project, SiteData } from "./types";

const DATA_DIR = path.join(process.cwd(), "src/data");
const PORTFOLIO_TAG = "portfolio-data";

const DEFAULT_DATA_FILES = {
  "site.json": DEFAULT_SITE_DATA,
  "projects.json": DEFAULT_PROJECTS,
  "experience.json": DEFAULT_EXPERIENCE,
} as const;

type DataFilename = keyof typeof DEFAULT_DATA_FILES;

function cloneDefaultData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

async function readJsonFile<T>(filename: DataFilename): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      const fallback = cloneDefaultData(DEFAULT_DATA_FILES[filename]) as T;
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf-8");
      return fallback;
    }

    throw error;
  }
}

export async function getSiteData(): Promise<SiteData> {
  "use cache";
  cacheTag(PORTFOLIO_TAG);
  return readJsonFile<SiteData>("site.json");
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheTag(PORTFOLIO_TAG);
  return readJsonFile<Project[]>("projects.json");
}

export async function getExperience(): Promise<Experience[]> {
  "use cache";
  cacheTag(PORTFOLIO_TAG);
  return readJsonFile<Experience[]>("experience.json");
}
