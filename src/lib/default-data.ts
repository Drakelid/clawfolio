"server-only";

import siteData from "@/data/site.json";
import projects from "@/data/projects.json";
import experience from "@/data/experience.json";
import type { Experience, Project, SiteData } from "./types";

export const DEFAULT_SITE_DATA = siteData as SiteData;
export const DEFAULT_PROJECTS = projects as Project[];
export const DEFAULT_EXPERIENCE = experience as Experience[];
