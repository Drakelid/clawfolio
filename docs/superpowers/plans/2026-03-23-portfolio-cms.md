# Portfolio CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-protected `/admin` CMS to the Clawfolio portfolio so the owner can edit projects, experience, and all site copy without touching code.

**Architecture:** Data lives in JSON files under `src/data/` (Docker volume-mounted). `page.tsx` and `layout.tsx` become async server components that read data at request time using the `'use cache'` directive. A REST API layer under `/api/admin/` handles CRUD — every write invalidates the cache via `revalidateTag`. The admin panel (`/app/admin/`) is a set of client-component pages protected by a signed-cookie middleware.

**Tech Stack:** Next.js 16.2 App Router, `'use cache'` + `cacheTag` + `revalidateTag`, Web Crypto API (HMAC-SHA256) for cookie signing, Tailwind CSS with existing CSS variables, TypeScript, Docker Compose bind mount for data persistence.

---

## File Map

### New files
| Path | Responsibility |
|---|---|
| `src/lib/types.ts` | Shared TS interfaces for all data shapes |
| `src/lib/auth.ts` | Edge-compatible HMAC token sign/verify |
| `src/lib/server-auth.ts` | Node-side admin cookie validator for API routes |
| `src/lib/data.ts` | Server-side cached data readers |
| `src/lib/write.ts` | Atomic JSON file writer + revalidation |
| `src/data/site.json` | Extracted hardcoded site content |
| `src/middleware.ts` | Auth guard for `/admin/*` and `/api/admin/*` |
| `src/app/admin/layout.tsx` | Admin shell: sidebar + logout |
| `src/app/admin/page.tsx` | Redirect → `/admin/site` |
| `src/app/admin/login/page.tsx` | Password form |
| `src/app/admin/site/page.tsx` | Site content editor (Hero/About/Contact tabs) |
| `src/app/admin/projects/page.tsx` | Projects CRUD |
| `src/app/admin/experience/page.tsx` | Experience CRUD |
| `src/app/admin/_components/Toast.tsx` | Toast notification component |
| `src/app/api/admin/auth/route.ts` | POST login |
| `src/app/api/admin/logout/route.ts` | POST logout |
| `src/app/api/admin/site/route.ts` | GET + PUT site.json |
| `src/app/api/admin/projects/route.ts` | GET all + POST new project |
| `src/app/api/admin/projects/[id]/route.ts` | PUT + DELETE project |
| `src/app/api/admin/experience/route.ts` | GET all + POST new entry |
| `src/app/api/admin/experience/[id]/route.ts` | PUT + DELETE entry |

### Modified files
| Path | Change |
|---|---|
| `next.config.ts` | Add `cacheComponents: true` |
| `src/app/page.tsx` | Async server component; reads data; passes as props |
| `src/app/layout.tsx` | Async server component; reads `site.meta` dynamically |
| `src/components/Hero.tsx` | Accept `data: HeroData` prop; remove hardcoded arrays |
| `src/components/About.tsx` | Accept `data: AboutData` prop; remove hardcoded objects |
| `src/components/Projects.tsx` | Accept `projects: Project[]` prop; remove JSON import |
| `src/components/Experience.tsx` | Accept `experience: Experience[]` prop; remove JSON import |
| `src/components/Contact.tsx` | Accept `data: ContactData` prop; remove hardcoded email |
| `docker-compose.yml` | Add `src/data` bind mount volume |

---

## Task 1: Shared types + site.json

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/data/site.json`

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
// src/lib/types.ts

export interface MetaData {
  title: string;
  description: string;
  url: string;
}

export interface HeroData {
  name: string;
  role: string;
  taglines: string[];
  coordinates: { lat: string; lng: string };
  socials: { github: string; linkedin: string; twitter: string };
}

export interface Stat {
  label: string;
  value: number;
  suffix: string;
}

export interface AboutData {
  bio: string[]; // exactly 3 paragraphs
  stats: Stat[];
  techStack: Record<string, string[]>; // category → skill names
}

export interface ContactData {
  email: string;
}

export interface SiteData {
  meta: MetaData;
  hero: HeroData;
  about: AboutData;
  contact: ContactData;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  category: string;
  featured: boolean;
  accent: string;
  links: { live: string; github: string };
}

export interface Experience {
  id: number;
  role: string;
  company: string;
  companyUrl: string | null;
  period: string;
  description: string[];
}
```

- [ ] **Step 2: Create `src/data/site.json`** with the current hardcoded values extracted from components

```json
{
  "meta": {
    "title": "Fredrik Drakelid — Full Stack Developer",
    "description": "Full stack developer with 8+ years of experience building scalable web applications. Specializing in React, Next.js, Node.js, and cloud infrastructure.",
    "url": "https://fredrikdrakelid.dev"
  },
  "hero": {
    "name": "Fredrik Drakelid",
    "role": "Full Stack Developer",
    "taglines": [
      "I build scalable APIs",
      "I craft beautiful UIs",
      "I ship real products"
    ],
    "coordinates": { "lat": "48.8566° N", "lng": "2.3522° E" },
    "socials": {
      "github": "https://github.com/fredrikdrakelid",
      "linkedin": "https://linkedin.com/in/fredrikdrakelid",
      "twitter": "https://twitter.com/fredrikdrakelid"
    }
  },
  "about": {
    "bio": [
      "I'm a full stack developer who thrives at the intersection of design and engineering.",
      "With 8 years of experience shipping products at companies like Vercel, Stripe, and Figma, I bring a deep understanding of both frontend craft and backend architecture.",
      "I'm passionate about building tools that developers love and experiences that users remember."
    ],
    "stats": [
      { "label": "Years Experience", "value": 8, "suffix": "+" },
      { "label": "Projects Shipped", "value": 50, "suffix": "+" },
      { "label": "Cups of Coffee", "value": 4200, "suffix": "+" }
    ],
    "techStack": {
      "Frontend": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Three.js", "Vue.js"],
      "Backend": ["Node.js", "Python", "Go", "PostgreSQL", "Redis", "GraphQL", "Docker"],
      "Tools": ["Git", "AWS", "Vercel", "Figma", "Linux", "CI/CD", "Terraform"]
    }
  },
  "contact": {
    "email": "fredrik@fredrikdrakelid.dev"
  }
}
```

- [ ] **Step 3: Commit**

```
git add src/lib/types.ts src/data/site.json
git commit -m "feat(cms): add shared types and extract site content to site.json"
```

---

## Task 2: Enable cacheComponents + data readers

**Files:**
- Modify: `next.config.ts`
- Create: `src/lib/data.ts`

- [ ] **Step 1: Enable `cacheComponents` in `next.config.ts`**

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

- [ ] **Step 2: Create `src/lib/data.ts`**

```ts
// src/lib/data.ts
import "server-only";
import { cacheTag } from "next/cache";
import fs from "fs/promises";
import path from "path";
import type { SiteData, Project, Experience } from "./types";

const DATA_DIR = path.join(process.cwd(), "src/data");

export async function getSiteData(): Promise<SiteData> {
  "use cache";
  cacheTag("portfolio-data");
  const raw = await fs.readFile(path.join(DATA_DIR, "site.json"), "utf-8");
  return JSON.parse(raw) as SiteData;
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheTag("portfolio-data");
  const raw = await fs.readFile(path.join(DATA_DIR, "projects.json"), "utf-8");
  return JSON.parse(raw) as Project[];
}

export async function getExperience(): Promise<Experience[]> {
  "use cache";
  cacheTag("portfolio-data");
  const raw = await fs.readFile(
    path.join(DATA_DIR, "experience.json"),
    "utf-8"
  );
  return JSON.parse(raw) as Experience[];
}
```

- [ ] **Step 3: Verify the readers work by running the dev server**

```
npm run dev
```

Expected: dev server starts without errors. No test yet — components still import directly from JSON.

- [ ] **Step 4: Commit**

```
git add next.config.ts src/lib/data.ts
git commit -m "feat(cms): add cacheComponents config and server-side data readers"
```

---

## Task 3: Atomic write utility + revalidation helper

**Files:**
- Create: `src/lib/write.ts`

- [ ] **Step 1: Create `src/lib/write.ts`**

```ts
// src/lib/write.ts
import "server-only";
import { revalidateTag } from "next/cache";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src/data");

/**
 * Atomically writes data to a JSON file and invalidates the portfolio cache.
 * Writes to a .tmp file first, then renames — safe against process kills.
 */
export async function writeDataFile(
  filename: string,
  data: unknown
): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmpPath, filePath);
  revalidateTag("portfolio-data", "max");
}
```

- [ ] **Step 2: Commit**

```
git add src/lib/write.ts
git commit -m "feat(cms): add atomic JSON write utility with cache revalidation"
```

---

## Task 4: Auth utilities (Edge-compatible)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/server-auth.ts`

- [ ] **Step 1: Create `src/lib/auth.ts`** — uses Web Crypto API only, safe for Edge Runtime (middleware)

```ts
// src/lib/auth.ts
// Edge-compatible: no Node.js-only APIs

export const COOKIE_NAME = "admin_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function b64urlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createToken(secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp)
  );
  return `${timestamp}.${b64urlEncode(sig)}`;
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<boolean> {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const timestamp = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > MAX_AGE_MS || age < 0) return false;

  try {
    const key = await getKey(secret);
    return crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sigB64),
      new TextEncoder().encode(timestamp)
    );
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Create `src/lib/server-auth.ts`** — Node.js-only helper used in API routes to validate the cookie from the incoming request

```ts
// src/lib/server-auth.ts
import "server-only";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "./auth";

export async function validateAdminCookie(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyToken(token, secret);
}
```

- [ ] **Step 3: Commit**

```
git add src/lib/auth.ts src/lib/server-auth.ts
git commit -m "feat(cms): add HMAC token auth utilities for admin cookie"
```

---

## Task 5: Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Add `.env.local` entries** (do not commit this file)

```
ADMIN_PASSWORD=changeme
ADMIN_SECRET=changeme-32-char-random-string-here
```

- [ ] **Step 2: Create `src/middleware.ts`**

```ts
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page and auth API through without cookie check
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/auth") ||
    pathname.startsWith("/api/admin/logout")
  ) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SECRET;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!secret || !token || !(await verifyToken(token, secret))) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

- [ ] **Step 3: Verify middleware loads without errors**

```
npm run dev
```

Navigate to `http://localhost:3000/admin`. Expected: redirect to `/admin/login`.

- [ ] **Step 4: Commit**

```
git add src/middleware.ts
git commit -m "feat(cms): add admin middleware with HMAC cookie auth guard"
```

---

## Task 6: Auth API routes + admin login page

**Files:**
- Create: `src/app/api/admin/auth/route.ts`
- Create: `src/app/api/admin/logout/route.ts`
- Create: `src/app/admin/login/page.tsx`

- [ ] **Step 1: Create `src/app/api/admin/auth/route.ts`**

```ts
// src/app/api/admin/auth/route.ts
import { cookies } from "next/headers";
import { createToken, COOKIE_NAME } from "@/lib/auth";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: "" }));
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET;

  if (!expected || !secret) {
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!timingSafeEqual(String(password), expected)) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createToken(secret);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  });

  return Response.json({ success: true });
}
```

- [ ] **Step 2: Create `src/app/api/admin/logout/route.ts`**

```ts
// src/app/api/admin/logout/route.ts
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return Response.json({ success: true });
}
```

- [ ] **Step 3: Create `src/app/admin/login/page.tsx`**

```tsx
// src/app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin/site");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
      className="min-h-screen flex items-center justify-center"
    >
      <div
        className="glass rounded-xl p-8 w-full max-w-sm"
        style={{ border: "1px solid var(--border)" }}
      >
        <h1 className="font-mono text-xl font-bold mb-6" style={{ color: "var(--accent)" }}>
          Clawfolio CMS
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg px-3 py-2 font-mono text-sm bg-transparent outline-none"
              style={{
                border: `1px solid ${error ? "var(--color-red-500, #ef4444)" : "var(--border)"}`,
                color: "var(--text-primary)",
              }}
            />
            {error && (
              <p className="mt-1 font-mono text-xs text-red-400">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full px-4 py-2 font-mono text-sm font-medium text-white"
            style={{
              background: loading ? "var(--text-muted)" : "var(--accent)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Verifying…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify end-to-end login flow**

```
npm run dev
```

1. Navigate to `http://localhost:3000/admin` → should redirect to `/admin/login`
2. Enter wrong password → should show "Invalid password"
3. Enter correct password (value of `ADMIN_PASSWORD` in `.env.local`) → should redirect to `/admin/site` (will 404 for now — that's expected)

- [ ] **Step 5: Commit**

```
git add src/app/api/admin/auth/route.ts src/app/api/admin/logout/route.ts src/app/admin/login/page.tsx
git commit -m "feat(cms): add admin auth API routes and login page"
```

---

## Task 7: Component refactor — accept props

Refactor all five data-consuming components to accept typed props instead of importing data directly. **The portfolio will still work after this step** because `page.tsx` will supply the data.

**Files:**
- Modify: `src/components/Hero.tsx`
- Modify: `src/components/About.tsx`
- Modify: `src/components/Projects.tsx`
- Modify: `src/components/Experience.tsx`
- Modify: `src/components/Contact.tsx`

- [ ] **Step 1: Refactor `src/components/Hero.tsx`**

In `Hero.tsx`:
1. Add `import type { HeroData } from "@/lib/types";` at the top
2. Change the `Hero` component signature from `export default function Hero()` to `export default function Hero({ data }: { data: HeroData })`
3. Replace the hardcoded `taglines` array at line 16 — use `data.taglines` instead
4. Replace the hardcoded `socialLinks` array (lines 22-50) — rebuild using `data.socials`:

```tsx
const socialLinks = [
  {
    label: "GitHub",
    href: data.socials.github,
    icon: (/* existing SVG */),
  },
  {
    label: "LinkedIn",
    href: data.socials.linkedin,
    icon: (/* existing SVG */),
  },
  {
    label: "Twitter",
    href: data.socials.twitter,
    icon: (/* existing SVG */),
  },
];
```

5. Replace the coordinate strings in the corner decorations (lines 453-456):
```tsx
<div>{data.coordinates.lat}</div>
<div>{data.coordinates.lng}</div>
```

6. Replace the `renderRoleLine` text with `data.role`:
```tsx
const text = data.role;
```

Note: `codeLines` (decorative code background) stays hardcoded — it is not user-editable content.

- [ ] **Step 2: Refactor `src/components/About.tsx`**

1. Add `import type { AboutData } from "@/lib/types";`
2. Change signature: `export default function About({ data }: { data: AboutData })`
3. Remove the hardcoded `stats` array (lines 11-15) — use `data.stats` in the JSX
4. Remove the hardcoded `techStack` object (lines 17-30) — use `data.techStack`
5. Replace the three `<AnimatedText>` bio paragraphs — render `data.bio` array:
```tsx
{data.bio.map((paragraph, i) => (
  <AnimatedText
    key={i}
    text={paragraph}
    type="words"
    as="p"
    delay={i * 10}
  />
))}
```
6. Change `Object.entries(techStack)` → `Object.entries(data.techStack)`
7. Change `stats.map(...)` → `data.stats.map(...)`

- [ ] **Step 3: Refactor `src/components/Projects.tsx`**

1. Add `import type { Project } from "@/lib/types";`
2. Remove `import projectsData from "@/data/projects.json";`
3. Change signature: `export default function Projects({ projects }: { projects: Project[] })`
4. Replace all references to `projectsData` with `projects`

- [ ] **Step 4: Refactor `src/components/Experience.tsx`**

1. Add `import type { Experience } from "@/lib/types";`
2. Remove `import experienceData from "@/data/experience.json";`
3. Change signature: `export default function Experience({ experience }: { experience: Experience[] })`
4. Replace all references to `experienceData` with `experience`

- [ ] **Step 5: Refactor `src/components/Contact.tsx`**

1. Add `import type { ContactData } from "@/lib/types";`
2. Change signature: `export default function Contact({ data }: { data: ContactData })`
3. Remove the hardcoded `const email = "fredrik@fredrikdrakelid.dev";`
4. Replace with `const email = data.email;`

- [ ] **Step 6: Commit**

```
git add src/components/Hero.tsx src/components/About.tsx src/components/Projects.tsx src/components/Experience.tsx src/components/Contact.tsx
git commit -m "feat(cms): refactor components to accept data as props"
```

---

## Task 8: page.tsx + layout.tsx server component refactor

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Rewrite `src/app/page.tsx`** as an async server component

```tsx
// src/app/page.tsx
import dynamic from "next/dynamic";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Experience from "@/components/Experience";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getSiteData, getProjects, getExperience } from "@/lib/data";

const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), {
  ssr: false,
});
const SmoothScroll = dynamic(() => import("@/components/SmoothScroll"), {
  ssr: false,
});
const ScrollProgress = dynamic(
  () => import("@/components/ui/ScrollProgress"),
  { ssr: false }
);
const MouseSpotlight = dynamic(
  () => import("@/components/ui/MouseSpotlight"),
  { ssr: false }
);

export default async function Home() {
  const [site, projects, experience] = await Promise.all([
    getSiteData(),
    getProjects(),
    getExperience(),
  ]);

  return (
    <>
      <SmoothScroll />
      <CustomCursor />
      <ScrollProgress />
      <MouseSpotlight />
      <Navbar />
      <main role="main">
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Hero data={site.hero} />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <About data={site.about} />
        </ErrorBoundary>
        <ErrorBoundary>
          <Projects projects={projects} />
        </ErrorBoundary>
        <ErrorBoundary>
          <Experience experience={experience} />
        </ErrorBoundary>
        <ErrorBoundary>
          <Contact data={site.contact} />
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Update `src/app/layout.tsx`** to read metadata dynamically

```tsx
// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSiteData } from "@/lib/data";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0A0F",
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  return {
    title: site.meta.title,
    description: site.meta.description,
    keywords: ["full stack developer", "react", "next.js", "typescript", "node.js", "portfolio"],
    authors: [{ name: site.hero.name }],
    openGraph: {
      type: "website",
      locale: "en_US",
      title: site.meta.title,
      description: site.meta.description,
      siteName: "Clawfolio",
    },
    twitter: {
      card: "summary_large_image",
      title: site.meta.title,
      description: site.meta.description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSiteData();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: site.hero.name,
              url: site.meta.url,
              jobTitle: site.hero.role,
              sameAs: [
                site.hero.socials.github,
                site.hero.socials.linkedin,
                site.hero.socials.twitter,
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the portfolio still renders correctly**

```
npm run dev
```

Navigate to `http://localhost:3000`. Expected:
- Portfolio loads and looks identical to before
- Hero shows "Fredrik Drakelid", correct taglines, social links
- About section shows bio text, stats, tech stack
- Projects grid shows all 6 projects
- Experience timeline shows all 4 entries
- Contact shows the correct email

- [ ] **Step 4: Commit**

```
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat(cms): convert page.tsx and layout.tsx to async server components"
```

---

## Task 9: Site API route

**Files:**
- Create: `src/app/api/admin/site/route.ts`

- [ ] **Step 1: Create `src/app/api/admin/site/route.ts`**

```ts
// src/app/api/admin/site/route.ts
import { validateAdminCookie } from "@/lib/server-auth";
import { writeDataFile } from "@/lib/write";
import type { SiteData } from "@/lib/types";
import fs from "fs/promises";
import path from "path";

const SITE_FILE = path.join(process.cwd(), "src/data/site.json");

export async function GET() {
  if (!(await validateAdminCookie())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await fs.readFile(SITE_FILE, "utf-8");
  return Response.json({ data: JSON.parse(raw) });
}

export async function PUT(request: Request) {
  if (!(await validateAdminCookie())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SiteData;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Field validation
  if (!body.hero?.name?.trim()) return Response.json({ error: "hero.name is required" }, { status: 400 });
  if ((body.hero.name?.length ?? 0) > 100) return Response.json({ error: "hero.name must be 100 chars or fewer" }, { status: 400 });
  if (!body.hero?.role?.trim()) return Response.json({ error: "hero.role is required" }, { status: 400 });
  if ((body.hero.role?.length ?? 0) > 100) return Response.json({ error: "hero.role must be 100 chars or fewer" }, { status: 400 });
  if (!body.hero?.taglines?.length || body.hero.taglines.some((t: string) => !t.trim()))
    return Response.json({ error: "hero.taglines must have at least one non-empty entry" }, { status: 400 });
  if (!body.about?.bio || body.about.bio.length !== 3 || body.about.bio.some((p: string) => !p.trim()))
    return Response.json({ error: "about.bio must have exactly 3 non-empty paragraphs" }, { status: 400 });
  if (!body.contact?.email?.includes("@")) return Response.json({ error: "contact.email is invalid" }, { status: 400 });
  if (!body.meta?.title?.trim()) return Response.json({ error: "meta.title is required" }, { status: 400 });
  if ((body.meta.title?.length ?? 0) > 70) return Response.json({ error: "meta.title must be 70 chars or fewer" }, { status: 400 });
  if (!body.meta?.description?.trim()) return Response.json({ error: "meta.description is required" }, { status: 400 });
  if ((body.meta.description?.length ?? 0) > 160) return Response.json({ error: "meta.description must be 160 chars or fewer" }, { status: 400 });

  await writeDataFile("site.json", body);
  return Response.json({ data: body });
}
```

- [ ] **Step 2: Verify with curl**

```bash
# Should return 401
curl -X GET http://localhost:3000/api/admin/site

# After logging in via browser, copy the admin_session cookie value, then:
curl -X GET http://localhost:3000/api/admin/site \
  -H "Cookie: admin_session=<your-token>"
# Expected: { data: { meta: {...}, hero: {...}, ... } }
```

- [ ] **Step 3: Commit**

```
git add src/app/api/admin/site/route.ts
git commit -m "feat(cms): add site content GET/PUT API route"
```

---

## Task 10: Projects API routes

**Files:**
- Create: `src/app/api/admin/projects/route.ts`
- Create: `src/app/api/admin/projects/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/admin/projects/route.ts`**

```ts
// src/app/api/admin/projects/route.ts
import { validateAdminCookie } from "@/lib/server-auth";
import { writeDataFile } from "@/lib/write";
import type { Project } from "@/lib/types";
import fs from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "src/data/projects.json");

async function readProjects(): Promise<Project[]> {
  return JSON.parse(await fs.readFile(FILE, "utf-8")) as Project[];
}

function validateProject(p: Partial<Project>): string | null {
  if (!p.title?.trim()) return "title is required";
  if ((p.title?.length ?? 0) > 100) return "title must be 100 chars or fewer";
  if (!p.description?.trim()) return "description is required";
  if ((p.description?.length ?? 0) > 500) return "description must be 500 chars or fewer";
  if (!["Full Stack", "Frontend", "Backend"].includes(p.category ?? "")) return "category must be Full Stack, Frontend, or Backend";
  if (!p.accent) return "accent is required";
  if (!p.links?.live) return "links.live is required";
  if (!p.links?.github) return "links.github is required";
  return null;
}

export async function GET() {
  if (!(await validateAdminCookie())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ data: await readProjects() });
}

export async function POST(request: Request) {
  if (!(await validateAdminCookie())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<Project>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validationError = validateProject(body);
  if (validationError) return Response.json({ error: validationError }, { status: 400 });

  const projects = await readProjects();
  const newId = Math.max(0, ...projects.map((p) => p.id)) + 1;
  const newProject: Project = {
    id: newId,
    title: body.title!.trim(),
    description: body.description!.trim(),
    image: body.image ?? "",
    tags: body.tags ?? [],
    category: body.category!,
    featured: body.featured ?? false,
    accent: body.accent!,
    links: { live: body.links!.live, github: body.links!.github },
  };

  await writeDataFile("projects.json", [...projects, newProject]);
  return Response.json({ data: newProject });
}
```

- [ ] **Step 2: Create `src/app/api/admin/projects/[id]/route.ts`**

```ts
// src/app/api/admin/projects/[id]/route.ts
import { validateAdminCookie } from "@/lib/server-auth";
import { writeDataFile } from "@/lib/write";
import type { Project } from "@/lib/types";
import fs from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "src/data/projects.json");

async function readProjects(): Promise<Project[]> {
  return JSON.parse(await fs.readFile(FILE, "utf-8")) as Project[];
}

function validateProject(p: Partial<Project>): string | null {
  if (!p.title?.trim()) return "title is required";
  if ((p.title?.length ?? 0) > 100) return "title must be 100 chars or fewer";
  if (!p.description?.trim()) return "description is required";
  if ((p.description?.length ?? 0) > 500) return "description must be 500 chars or fewer";
  if (!["Full Stack", "Frontend", "Backend"].includes(p.category ?? "")) return "category must be Full Stack, Frontend, or Backend";
  if (!p.accent) return "accent is required";
  if (!p.links?.live) return "links.live is required";
  if (!p.links?.github) return "links.github is required";
  return null;
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/admin/projects/[id]">
) {
  if (!(await validateAdminCookie())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const numId = parseInt(id, 10);

  let body: Partial<Project>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validationError = validateProject(body);
  if (validationError) return Response.json({ error: validationError }, { status: 400 });

  const projects = await readProjects();
  const idx = projects.findIndex((p) => p.id === numId);
  if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });

  const updated: Project = {
    ...projects[idx],
    title: body.title!.trim(),
    description: body.description!.trim(),
    image: body.image ?? projects[idx].image,
    tags: body.tags ?? [],
    category: body.category!,
    featured: body.featured ?? false,
    accent: body.accent!,
    links: { live: body.links!.live, github: body.links!.github },
  };

  const next = [...projects];
  next[idx] = updated;
  await writeDataFile("projects.json", next);
  return Response.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/projects/[id]">
) {
  if (!(await validateAdminCookie())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const numId = parseInt(id, 10);
  const projects = await readProjects();
  const filtered = projects.filter((p) => p.id !== numId);

  if (filtered.length === projects.length) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await writeDataFile("projects.json", filtered);
  return Response.json({ data: null });
}
```

- [ ] **Step 3: Commit**

```
git add src/app/api/admin/projects/route.ts "src/app/api/admin/projects/[id]/route.ts"
git commit -m "feat(cms): add projects CRUD API routes"
```

---

## Task 11: Experience API routes

**Files:**
- Create: `src/app/api/admin/experience/route.ts`
- Create: `src/app/api/admin/experience/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/admin/experience/route.ts`**

```ts
// src/app/api/admin/experience/route.ts
import { validateAdminCookie } from "@/lib/server-auth";
import { writeDataFile } from "@/lib/write";
import type { Experience } from "@/lib/types";
import fs from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "src/data/experience.json");

async function readExperience(): Promise<Experience[]> {
  return JSON.parse(await fs.readFile(FILE, "utf-8")) as Experience[];
}

function validate(e: Partial<Experience>): string | null {
  if (!e.role?.trim()) return "role is required";
  if ((e.role?.length ?? 0) > 100) return "role must be 100 chars or fewer";
  if (!e.company?.trim()) return "company is required";
  if ((e.company?.length ?? 0) > 100) return "company must be 100 chars or fewer";
  if (!e.period?.trim()) return "period is required";
  if (!e.description?.length || e.description.some((d) => !d.trim())) return "at least one non-empty description bullet is required";
  return null;
}

export async function GET() {
  if (!(await validateAdminCookie())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ data: await readExperience() });
}

export async function POST(request: Request) {
  if (!(await validateAdminCookie())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<Experience>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const err = validate(body);
  if (err) return Response.json({ error: err }, { status: 400 });

  const entries = await readExperience();
  const newId = Math.max(0, ...entries.map((e) => e.id)) + 1;
  const newEntry: Experience = {
    id: newId,
    role: body.role!.trim(),
    company: body.company!.trim(),
    companyUrl: body.companyUrl?.trim() || null,
    period: body.period!.trim(),
    description: body.description!.map((d) => d.trim()),
  };

  await writeDataFile("experience.json", [...entries, newEntry]);
  return Response.json({ data: newEntry });
}
```

- [ ] **Step 2: Create `src/app/api/admin/experience/[id]/route.ts`**

```ts
// src/app/api/admin/experience/[id]/route.ts
import { validateAdminCookie } from "@/lib/server-auth";
import { writeDataFile } from "@/lib/write";
import type { Experience } from "@/lib/types";
import fs from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "src/data/experience.json");

async function readExperience(): Promise<Experience[]> {
  return JSON.parse(await fs.readFile(FILE, "utf-8")) as Experience[];
}

function validate(e: Partial<Experience>): string | null {
  if (!e.role?.trim()) return "role is required";
  if ((e.role?.length ?? 0) > 100) return "role must be 100 chars or fewer";
  if (!e.company?.trim()) return "company is required";
  if ((e.company?.length ?? 0) > 100) return "company must be 100 chars or fewer";
  if (!e.period?.trim()) return "period is required";
  if (!e.description?.length || e.description.some((d) => !d.trim())) return "at least one non-empty description bullet is required";
  return null;
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/admin/experience/[id]">
) {
  if (!(await validateAdminCookie())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const numId = parseInt(id, 10);

  let body: Partial<Experience>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const err = validate(body);
  if (err) return Response.json({ error: err }, { status: 400 });

  const entries = await readExperience();
  const idx = entries.findIndex((e) => e.id === numId);
  if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });

  const updated: Experience = {
    id: numId,
    role: body.role!.trim(),
    company: body.company!.trim(),
    companyUrl: body.companyUrl?.trim() || null,
    period: body.period!.trim(),
    description: body.description!.map((d) => d.trim()),
  };

  const next = [...entries];
  next[idx] = updated;
  await writeDataFile("experience.json", next);
  return Response.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/experience/[id]">
) {
  if (!(await validateAdminCookie())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const numId = parseInt(id, 10);
  const entries = await readExperience();
  const filtered = entries.filter((e) => e.id !== numId);

  if (filtered.length === entries.length) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await writeDataFile("experience.json", filtered);
  return Response.json({ data: null });
}
```

- [ ] **Step 3: Commit**

```
git add src/app/api/admin/experience/route.ts "src/app/api/admin/experience/[id]/route.ts"
git commit -m "feat(cms): add experience CRUD API routes"
```

---

## Task 12: Admin layout + Toast component

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/_components/Toast.tsx`

- [ ] **Step 1: Create `src/app/admin/_components/Toast.tsx`**

```tsx
// src/app/admin/_components/Toast.tsx
"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 font-mono text-sm shadow-lg"
      style={{
        background: type === "success" ? "var(--accent)" : "#ef4444",
        color: "#fff",
      }}
    >
      <span>{type === "success" ? "✓" : "✗"}</span>
      <span>{message}</span>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/admin/layout.tsx`**

```tsx
// src/app/admin/layout.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const navItems = [
  { label: "Site", href: "/admin/site" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Experience", href: "/admin/experience" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return <>{children}</>;

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Sidebar */}
      <aside
        className="w-48 flex-shrink-0 flex flex-col border-r"
        style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
      >
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="font-mono text-sm font-bold" style={{ color: "var(--accent)" }}>
            Clawfolio CMS
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="block rounded-lg px-3 py-2 font-mono text-sm transition-colors"
              style={{
                background: pathname.startsWith(href) ? "var(--accent)" : "transparent",
                color: pathname.startsWith(href) ? "#fff" : "var(--text-muted)",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg px-3 py-2 font-mono text-xs text-center transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            View Site ↗
          </a>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 font-mono text-xs transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/page.tsx`**

```tsx
// src/app/admin/page.tsx
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/site");
}
```

- [ ] **Step 4: Verify admin shell renders**

After logging in at `http://localhost:3000/admin/login`, the sidebar should be visible with Site, Projects, Experience links. Clicking a link should navigate (pages will be empty for now).

- [ ] **Step 5: Commit**

```
git add src/app/admin/layout.tsx src/app/admin/page.tsx src/app/admin/_components/Toast.tsx
git commit -m "feat(cms): add admin shell layout, redirect, and toast component"
```

---

## Task 13: Admin site editor

**Files:**
- Create: `src/app/admin/site/page.tsx`

This page has three tabs (Hero, About, Contact & Meta). Each tab `PUT`s `/api/admin/site` with the full `SiteData` body.

- [ ] **Step 1: Create `src/app/admin/site/page.tsx`**

```tsx
// src/app/admin/site/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { SiteData, Stat } from "@/lib/types";
import Toast from "../_components/Toast";

const inputClass =
  "w-full rounded-lg border px-3 py-2 font-mono text-sm bg-transparent outline-none focus:border-[var(--accent)]";
const inputStyle = { borderColor: "var(--border)", color: "var(--text-primary)" };
const labelClass = "block font-mono text-xs mb-1";
const labelStyle = { color: "var(--text-muted)" };
const sectionClass = "space-y-4 mb-8";

type Tab = "hero" | "about" | "contact";

export default function SitePage() {
  const [data, setData] = useState<SiteData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("hero");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/admin/site")
      .then((r) => r.json())
      .then((r) => setData(r.data));
  }, []);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        setToast({ message: "Saved", type: "success" });
      } else {
        setToast({ message: json.error ?? "Save failed", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateHero = (key: string, value: unknown) =>
    setData((d) => d ? { ...d, hero: { ...d.hero, [key]: value } } : d);

  const updateSocial = (key: string, value: string) =>
    setData((d) => d ? { ...d, hero: { ...d.hero, socials: { ...d.hero.socials, [key]: value } } } : d);

  const updateCoord = (key: string, value: string) =>
    setData((d) => d ? { ...d, hero: { ...d.hero, coordinates: { ...d.hero.coordinates, [key]: value } } } : d);

  const updateBio = (i: number, value: string) =>
    setData((d) => {
      if (!d) return d;
      const bio = [...d.about.bio];
      bio[i] = value;
      return { ...d, about: { ...d.about, bio } };
    });

  const updateStat = (i: number, key: keyof Stat, value: string | number) =>
    setData((d) => {
      if (!d) return d;
      const stats = [...d.about.stats];
      stats[i] = { ...stats[i], [key]: value };
      return { ...d, about: { ...d.about, stats } };
    });

  const addTaglineInput = () =>
    setData((d) => d ? { ...d, hero: { ...d.hero, taglines: [...d.hero.taglines, ""] } } : d);

  const removeTagline = (i: number) =>
    setData((d) => {
      if (!d) return d;
      const taglines = d.hero.taglines.filter((_, idx) => idx !== i);
      return { ...d, hero: { ...d.hero, taglines } };
    });

  const updateTagline = (i: number, value: string) =>
    setData((d) => {
      if (!d) return d;
      const taglines = [...d.hero.taglines];
      taglines[i] = value;
      return { ...d, hero: { ...d.hero, taglines } };
    });

  // Tech stack helpers
  const addSkill = (category: string, skill: string) => {
    if (!skill.trim()) return;
    setData((d) => {
      if (!d) return d;
      const techStack = { ...d.about.techStack };
      techStack[category] = [...(techStack[category] ?? []), skill.trim()];
      return { ...d, about: { ...d.about, techStack } };
    });
  };

  const removeSkill = (category: string, idx: number) =>
    setData((d) => {
      if (!d) return d;
      const techStack = { ...d.about.techStack };
      techStack[category] = techStack[category].filter((_, i) => i !== idx);
      return { ...d, about: { ...d.about, techStack } };
    });

  const addCategory = () =>
    setData((d) => {
      if (!d) return d;
      const name = `Category ${Object.keys(d.about.techStack).length + 1}`;
      return { ...d, about: { ...d.about, techStack: { ...d.about.techStack, [name]: [] } } };
    });

  const removeCategory = (cat: string) =>
    setData((d) => {
      if (!d) return d;
      const techStack = { ...d.about.techStack };
      delete techStack[cat];
      return { ...d, about: { ...d.about, techStack } };
    });

  const renameCategory = (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return;
    setData((d) => {
      if (!d) return d;
      const techStack: Record<string, string[]> = {};
      for (const [key, val] of Object.entries(d.about.techStack)) {
        techStack[key === oldName ? newName.trim() : key] = val;
      }
      return { ...d, about: { ...d.about, techStack } };
    });
  };

  if (!data) {
    return <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "hero", label: "Hero" },
    { key: "about", label: "About" },
    { key: "contact", label: "Contact & Meta" },
  ];

  return (
    <div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
      <h1 className="font-mono text-2xl font-bold mb-6">Site Content</h1>

      {/* Tab bar */}
      <div className="flex gap-2 mb-8 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="pb-2 px-1 font-mono text-sm transition-colors"
            style={{
              color: activeTab === t.key ? "var(--accent)" : "var(--text-muted)",
              borderBottom: activeTab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Hero tab */}
      {activeTab === "hero" && (
        <div className={sectionClass}>
          <div>
            <label className={labelClass} style={labelStyle}>Name</label>
            <input className={inputClass} style={inputStyle} value={data.hero.name} onChange={(e) => updateHero("name", e.target.value)} maxLength={100} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Role</label>
            <input className={inputClass} style={inputStyle} value={data.hero.role} onChange={(e) => updateHero("role", e.target.value)} maxLength={100} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Taglines</label>
            {data.hero.taglines.map((t, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className={inputClass} style={inputStyle} value={t} onChange={(e) => updateTagline(i, e.target.value)} />
                <button onClick={() => removeTagline(i)} className="px-2 text-red-400 font-mono text-sm">✕</button>
              </div>
            ))}
            <button onClick={addTaglineInput} className="font-mono text-xs" style={{ color: "var(--accent)" }}>+ Add tagline</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Lat</label>
              <input className={inputClass} style={inputStyle} value={data.hero.coordinates.lat} onChange={(e) => updateCoord("lat", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Lng</label>
              <input className={inputClass} style={inputStyle} value={data.hero.coordinates.lng} onChange={(e) => updateCoord("lng", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>GitHub URL</label>
            <input className={inputClass} style={inputStyle} value={data.hero.socials.github} onChange={(e) => updateSocial("github", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>LinkedIn URL</label>
            <input className={inputClass} style={inputStyle} value={data.hero.socials.linkedin} onChange={(e) => updateSocial("linkedin", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Twitter URL</label>
            <input className={inputClass} style={inputStyle} value={data.hero.socials.twitter} onChange={(e) => updateSocial("twitter", e.target.value)} />
          </div>
          <button onClick={save} disabled={saving} className="rounded-full px-6 py-2 font-mono text-sm font-medium text-white" style={{ background: saving ? "var(--text-muted)" : "var(--accent)", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      {/* About tab */}
      {activeTab === "about" && (
        <div className={sectionClass}>
          <div>
            <label className={labelClass} style={labelStyle}>Bio paragraphs</label>
            {data.about.bio.map((p, i) => (
              <textarea
                key={i}
                className={`${inputClass} mb-2 resize-none`}
                style={inputStyle}
                rows={3}
                value={p}
                onChange={(e) => updateBio(i, e.target.value)}
              />
            ))}
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Stats</label>
            {data.about.stats.map((s, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input className={inputClass} style={inputStyle} placeholder="Label" value={s.label} onChange={(e) => updateStat(i, "label", e.target.value)} />
                <input className={inputClass} style={inputStyle} placeholder="Value" type="number" value={s.value} onChange={(e) => updateStat(i, "value", parseInt(e.target.value, 10) || 0)} />
                <input className={inputClass} style={inputStyle} placeholder="Suffix" value={s.suffix} onChange={(e) => updateStat(i, "suffix", e.target.value)} />
              </div>
            ))}
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Tech Stack</label>
            {Object.entries(data.about.techStack).map(([cat, skills]) => (
              <TechCategory key={cat} category={cat} skills={skills} onAddSkill={(s) => addSkill(cat, s)} onRemoveSkill={(i) => removeSkill(cat, i)} onRemoveCategory={() => removeCategory(cat)} onRenameCategory={(n) => renameCategory(cat, n)} />
            ))}
            <button onClick={addCategory} className="font-mono text-xs mt-2" style={{ color: "var(--accent)" }}>+ Add category</button>
          </div>
          <button onClick={save} disabled={saving} className="rounded-full px-6 py-2 font-mono text-sm font-medium text-white" style={{ background: saving ? "var(--text-muted)" : "var(--accent)", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      {/* Contact & Meta tab */}
      {activeTab === "contact" && (
        <div className={sectionClass}>
          <div>
            <label className={labelClass} style={labelStyle}>Contact email</label>
            <input className={inputClass} style={inputStyle} value={data.contact.email} onChange={(e) => setData((d) => d ? { ...d, contact: { email: e.target.value } } : d)} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Page title (max 70 chars)</label>
            <input className={inputClass} style={inputStyle} value={data.meta.title} maxLength={70} onChange={(e) => setData((d) => d ? { ...d, meta: { ...d.meta, title: e.target.value } } : d)} />
            <p className="font-mono text-xs mt-1" style={{ color: "var(--text-muted)" }}>{data.meta.title.length}/70</p>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Meta description (max 160 chars)</label>
            <textarea className={`${inputClass} resize-none`} style={inputStyle} rows={3} value={data.meta.description} maxLength={160} onChange={(e) => setData((d) => d ? { ...d, meta: { ...d.meta, description: e.target.value } } : d)} />
            <p className="font-mono text-xs mt-1" style={{ color: "var(--text-muted)" }}>{data.meta.description.length}/160</p>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Site URL</label>
            <input className={inputClass} style={inputStyle} value={data.meta.url} onChange={(e) => setData((d) => d ? { ...d, meta: { ...d.meta, url: e.target.value } } : d)} />
          </div>
          <button onClick={save} disabled={saving} className="rounded-full px-6 py-2 font-mono text-sm font-medium text-white" style={{ background: saving ? "var(--text-muted)" : "var(--accent)", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

// Sub-component for a tech stack category row
function TechCategory({
  category,
  skills,
  onAddSkill,
  onRemoveSkill,
  onRemoveCategory,
  onRenameCategory,
}: {
  category: string;
  skills: string[];
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (i: number) => void;
  onRemoveCategory: () => void;
  onRenameCategory: (newName: string) => void;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      onAddSkill(input);
      setInput("");
    }
  };

  return (
    <div className="mb-4 rounded-lg p-3" style={{ border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <input
          className="font-mono text-xs font-bold bg-transparent outline-none border-b"
          style={{ color: "var(--accent)", borderColor: "var(--border)" }}
          defaultValue={category}
          onBlur={(e) => onRenameCategory(e.target.value)}
        />
        <button onClick={onRemoveCategory} className="font-mono text-xs text-red-400">Remove category</button>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {skills.map((s, i) => (
          <span key={i} className="flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {s}
            <button onClick={() => onRemoveSkill(i)} className="text-red-400">✕</button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type skill and press Enter"
        className="w-full rounded-lg border px-2 py-1 font-mono text-xs bg-transparent outline-none"
        style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify site editor works end-to-end**

1. Log in and navigate to `/admin/site`
2. Change the hero name to something else and click Save
3. Navigate to `http://localhost:3000` in a new tab
4. Expected: the portfolio reflects the updated name (may take one page reload due to stale-while-revalidate)

- [ ] **Step 3: Commit**

```
git add src/app/admin/site/page.tsx
git commit -m "feat(cms): add site content editor with Hero/About/Contact tabs"
```

---

## Task 14: Admin projects page

**Files:**
- Create: `src/app/admin/projects/page.tsx`

- [ ] **Step 1: Create `src/app/admin/projects/page.tsx`**

```tsx
// src/app/admin/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { Project } from "@/lib/types";
import Toast from "../_components/Toast";

const inputClass = "w-full rounded-lg border px-3 py-2 font-mono text-sm bg-transparent outline-none focus:border-[var(--accent)]";
const inputStyle = { borderColor: "var(--border)", color: "var(--text-primary)" };
const labelClass = "block font-mono text-xs mb-1";
const labelStyle = { color: "var(--text-muted)" };

const CATEGORIES = ["Full Stack", "Frontend", "Backend"];
const EMPTY_PROJECT: Omit<Project, "id"> = {
  title: "", description: "", image: "", tags: [], category: "Full Stack",
  featured: false, accent: "#3B82F6", links: { live: "", github: "" },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetch("/api/admin/projects").then((r) => r.json()).then((r) => setProjects(r.data));
  }, []);

  const openNew = () => {
    setEditing({ id: 0, ...EMPTY_PROJECT });
    setIsNew(true);
    setTagInput("");
  };

  const openEdit = (p: Project) => {
    setEditing({ ...p });
    setIsNew(false);
    setTagInput("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const url = isNew ? "/api/admin/projects" : `/api/admin/projects/${editing.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const json = await res.json();
      if (res.ok) {
        setToast({ message: isNew ? "Project created" : "Project saved", type: "success" });
        setEditing(null);
        setIsNew(false);
        const updated = await fetch("/api/admin/projects").then((r) => r.json());
        setProjects(updated.data);
      } else {
        setToast({ message: json.error ?? "Save failed", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((p) => p.filter((x) => x.id !== id));
      setToast({ message: "Deleted", type: "success" });
    }
  };

  const addTag = () => {
    if (!tagInput.trim() || !editing) return;
    setEditing({ ...editing, tags: [...editing.tags, tagInput.trim()] });
    setTagInput("");
  };

  const removeTag = (i: number) => {
    if (!editing) return;
    setEditing({ ...editing, tags: editing.tags.filter((_, idx) => idx !== i) });
  };

  const field = <K extends keyof Project>(key: K, value: Project[K]) => {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  };

  // --- Inline form ---
  if (editing) {
    return (
      <div>
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="font-mono text-2xl font-bold">{isNew ? "Add Project" : "Edit Project"}</h1>
          <button onClick={cancelEdit} className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>← Back</button>
        </div>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className={labelClass} style={labelStyle}>Title *</label>
            <input className={inputClass} style={inputStyle} value={editing.title} maxLength={100} onChange={(e) => field("title", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Description *</label>
            <textarea className={`${inputClass} resize-none`} style={inputStyle} rows={4} value={editing.description} maxLength={500} onChange={(e) => field("description", e.target.value)} />
            <p className="font-mono text-xs mt-1" style={{ color: "var(--text-muted)" }}>{editing.description.length}/500</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Category *</label>
              <select className={inputClass} style={inputStyle} value={editing.category} onChange={(e) => field("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 font-mono text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>
                <input type="checkbox" checked={editing.featured} onChange={(e) => field("featured", e.target.checked)} />
                Featured
              </label>
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Tags</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {editing.tags.map((t, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  {t}
                  <button onClick={() => removeTag(i)} className="text-red-400">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className={`${inputClass} flex-1`} style={inputStyle} placeholder="Tag name" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} />
              <button onClick={addTag} className="font-mono text-xs px-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>Add</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Accent color *</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={editing.accent} onChange={(e) => field("accent", e.target.value)} className="h-9 w-12 rounded cursor-pointer" />
                <input className={`${inputClass} flex-1`} style={inputStyle} value={editing.accent} onChange={(e) => field("accent", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Image path</label>
              <input className={inputClass} style={inputStyle} value={editing.image} onChange={(e) => field("image", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Live URL *</label>
            <input className={inputClass} style={inputStyle} value={editing.links.live} onChange={(e) => setEditing({ ...editing, links: { ...editing.links, live: e.target.value } })} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>GitHub URL *</label>
            <input className={inputClass} style={inputStyle} value={editing.links.github} onChange={(e) => setEditing({ ...editing, links: { ...editing.links, github: e.target.value } })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="rounded-full px-6 py-2 font-mono text-sm font-medium text-white" style={{ background: saving ? "var(--text-muted)" : "var(--accent)", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={cancelEdit} className="rounded-full px-6 py-2 font-mono text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // --- List view ---
  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-2xl font-bold">Projects</h1>
        <button onClick={openNew} className="rounded-full px-4 py-2 font-mono text-sm font-medium text-white" style={{ background: "var(--accent)" }}>
          + Add Project
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <div key={p.id} className="rounded-xl p-4" style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>{p.title}</h3>
                  <span className="rounded-full px-2 py-0.5 font-mono text-xs" style={{ background: `${p.accent}22`, color: p.accent }}>{p.category}</span>
                  {p.featured && <span className="rounded-full px-2 py-0.5 font-mono text-xs" style={{ background: "var(--surface)", color: "var(--accent)" }}>Featured</span>}
                </div>
                <p className="font-mono text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{p.description}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => openEdit(p)} className="font-mono text-xs px-3 py-1 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Edit</button>
              <button onClick={() => handleDelete(p.id)} className="font-mono text-xs px-3 py-1 rounded-lg text-red-400" style={{ border: "1px solid #ef444440" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/app/admin/projects/page.tsx
git commit -m "feat(cms): add projects CRUD admin page"
```

---

## Task 15: Admin experience page

**Files:**
- Create: `src/app/admin/experience/page.tsx`

- [ ] **Step 1: Create `src/app/admin/experience/page.tsx`**

```tsx
// src/app/admin/experience/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { Experience } from "@/lib/types";
import Toast from "../_components/Toast";

const inputClass = "w-full rounded-lg border px-3 py-2 font-mono text-sm bg-transparent outline-none focus:border-[var(--accent)]";
const inputStyle = { borderColor: "var(--border)", color: "var(--text-primary)" };
const labelClass = "block font-mono text-xs mb-1";
const labelStyle = { color: "var(--text-muted)" };

const EMPTY: Omit<Experience, "id"> = {
  role: "", company: "", companyUrl: null, period: "", description: [""],
};

export default function ExperiencePage() {
  const [entries, setEntries] = useState<Experience[]>([]);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/admin/experience").then((r) => r.json()).then((r) => setEntries(r.data));
  }, []);

  const openNew = () => { setEditing({ id: 0, ...EMPTY }); setIsNew(true); };
  const openEdit = (e: Experience) => { setEditing({ ...e, description: [...e.description] }); setIsNew(false); };
  const cancelEdit = () => { setEditing(null); setIsNew(false); };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const url = isNew ? "/api/admin/experience" : `/api/admin/experience/${editing.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const json = await res.json();
      if (res.ok) {
        setToast({ message: isNew ? "Entry created" : "Entry saved", type: "success" });
        setEditing(null);
        setIsNew(false);
        const updated = await fetch("/api/admin/experience").then((r) => r.json());
        setEntries(updated.data);
      } else {
        setToast({ message: json.error ?? "Save failed", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/admin/experience/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((e) => e.filter((x) => x.id !== id));
      setToast({ message: "Deleted", type: "success" });
    }
  };

  const updateBullet = (i: number, value: string) => {
    if (!editing) return;
    const desc = [...editing.description];
    desc[i] = value;
    setEditing({ ...editing, description: desc });
  };

  const addBullet = () => {
    if (!editing) return;
    setEditing({ ...editing, description: [...editing.description, ""] });
  };

  const removeBullet = (i: number) => {
    if (!editing) return;
    setEditing({ ...editing, description: editing.description.filter((_, idx) => idx !== i) });
  };

  if (editing) {
    return (
      <div>
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="font-mono text-2xl font-bold">{isNew ? "Add Entry" : "Edit Entry"}</h1>
          <button onClick={cancelEdit} className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>← Back</button>
        </div>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className={labelClass} style={labelStyle}>Role *</label>
            <input className={inputClass} style={inputStyle} value={editing.role} maxLength={100} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Company *</label>
            <input className={inputClass} style={inputStyle} value={editing.company} maxLength={100} onChange={(e) => setEditing({ ...editing, company: e.target.value })} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Company URL (optional)</label>
            <input className={inputClass} style={inputStyle} value={editing.companyUrl ?? ""} onChange={(e) => setEditing({ ...editing, companyUrl: e.target.value || null })} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Period * (e.g. "2023 — Present")</label>
            <input className={inputClass} style={inputStyle} value={editing.period} onChange={(e) => setEditing({ ...editing, period: e.target.value })} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Description bullets *</label>
            {editing.description.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className={inputClass} style={inputStyle} value={d} onChange={(e) => updateBullet(i, e.target.value)} />
                <button onClick={() => removeBullet(i)} disabled={editing.description.length <= 1} className="px-2 font-mono text-sm text-red-400 disabled:opacity-30">✕</button>
              </div>
            ))}
            <button onClick={addBullet} className="font-mono text-xs" style={{ color: "var(--accent)" }}>+ Add bullet</button>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="rounded-full px-6 py-2 font-mono text-sm font-medium text-white" style={{ background: saving ? "var(--text-muted)" : "var(--accent)", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={cancelEdit} className="rounded-full px-6 py-2 font-mono text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-2xl font-bold">Experience</h1>
        <button onClick={openNew} className="rounded-full px-4 py-2 font-mono text-sm font-medium text-white" style={{ background: "var(--accent)" }}>
          + Add Entry
        </button>
      </div>
      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-xl p-4" style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
            <div>
              <p className="font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>{e.role}</p>
              <p className="font-mono text-xs" style={{ color: "var(--accent)" }}>{e.company} · {e.period}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(e)} className="font-mono text-xs px-3 py-1 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Edit</button>
              <button onClick={() => handleDelete(e.id)} className="font-mono text-xs px-3 py-1 rounded-lg text-red-400" style={{ border: "1px solid #ef444440" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify full experience CRUD flow**

1. Navigate to `/admin/experience`
2. Add a new entry, verify it appears in the list and on the portfolio
3. Edit an entry, verify changes persist
4. Delete an entry, verify it disappears

- [ ] **Step 3: Commit**

```
git add src/app/admin/experience/page.tsx
git commit -m "feat(cms): add experience CRUD admin page"
```

---

## Task 16: Docker volume

**Files:**
- Modify (or create): `docker-compose.yml`

- [ ] **Step 1: Add volume bind mount to `docker-compose.yml`**

If `docker-compose.yml` doesn't exist yet, create it. Otherwise, add the volume to the existing `app` service:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_SECRET=${ADMIN_SECRET}
    volumes:
      - ./src/data:/app/src/data
    restart: unless-stopped
```

The volume mount ensures edits to JSON files survive container restarts and image rebuilds. The host path `./src/data` must be writable by the container user (UID 1000 by default for Node images). On Coolify, set host directory permissions before first deploy:

```bash
chown -R 1000:1000 ./src/data
```

- [ ] **Step 2: Verify the volume works locally**

```bash
docker compose up --build
```

Navigate to `http://localhost:3000/admin`, make a content change, then restart the container:

```bash
docker compose restart
```

Navigate to `http://localhost:3000` — expected: content change persists.

- [ ] **Step 3: Commit**

```
git add docker-compose.yml
git commit -m "feat(cms): add Docker volume mount for persistent data storage"
```

---

## Final verification checklist

Before declaring done, verify each of these manually:

- [ ] `/admin` → redirects to `/admin/login` when not authenticated
- [ ] Wrong password → "Invalid password" error, no cookie set
- [ ] Correct password → redirect to `/admin/site`, sidebar visible
- [ ] Sidebar: Site / Projects / Experience nav links work
- [ ] "View Site ↗" opens `localhost:3000` in new tab
- [ ] Logout → redirects to `/admin/login`, cookie cleared
- [ ] Site editor: change hero name → save → portfolio shows new name after reload
- [ ] Site editor: change bio → save → portfolio shows new bio
- [ ] Site editor: meta description character counter counts correctly
- [ ] Projects: add new project → appears in portfolio
- [ ] Projects: edit project → changes reflect in portfolio
- [ ] Projects: delete project → removed from portfolio
- [ ] Experience: add / edit / delete all work and reflect in portfolio
- [ ] Direct URL access to `/api/admin/site` without cookie → `401 Unauthorized`
- [ ] Token older than 7 days is rejected (set clock forward to test if needed)
