export const BASE_PATH = "/portfolio";

const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

export function applyBasePath(path: string, basePath = BASE_PATH): string {
  const value = path.trim();

  if (!value || !basePath) {
    return value;
  }

  if (ABSOLUTE_URL_PATTERN.test(value) || value.startsWith("//")) {
    return value;
  }

  if (value === basePath || value.startsWith(`${basePath}/`)) {
    return value;
  }

  if (value === "/") {
    return basePath;
  }

  if (!value.startsWith("/")) {
    return value;
  }

  return `${basePath}${value}`;
}

export function withBasePath(path: string): string {
  return applyBasePath(path);
}
