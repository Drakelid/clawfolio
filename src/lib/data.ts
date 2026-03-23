import "server-only";

import fs from "fs/promises";
import path from "path";
import { cacheTag } from "next/cache";
import type { Experience, Project, SiteData } from "./types";

const DATA_DIR = path.join(process.cwd(), "src/data");
const PORTFOLIO_TAG = "portfolio-data";

async function readJsonFile<T>(filename: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
  return JSON.parse(raw) as T;
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
