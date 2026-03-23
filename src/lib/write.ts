import "server-only";

import fs from "fs/promises";
import path from "path";
import { revalidateTag } from "next/cache";

const DATA_DIR = path.join(process.cwd(), "src/data");

export async function writeDataFile(filename: string, data: unknown): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = `${filePath}.tmp`;

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");

  try {
    await fs.rename(tmpPath, filePath);
  } catch {
    await fs.rm(filePath, { force: true });
    await fs.rename(tmpPath, filePath);
  }

  revalidateTag("portfolio-data", "max");
}
