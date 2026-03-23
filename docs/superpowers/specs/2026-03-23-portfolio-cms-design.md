# Portfolio CMS — Design Spec

**Date:** 2026-03-23
**Project:** Clawfolio (Next.js 16.2 portfolio site)
**Approach:** REST API routes + server components

---

## Overview

Add a password-protected `/admin` CMS to the portfolio that lets the owner edit all site content — projects, experience, and hardcoded site copy — without touching code. Data is stored as JSON files on a Docker volume, read server-side at request time, and mutated via REST API routes.

---

## 1. Data Layer

### New file: `src/data/site.json`

Captures all currently hardcoded content from components:

```json
{
  "meta": {
    "title": "Fredrik Drakelid — Full Stack Developer",
    "description": "Full stack developer with 8+ years of experience...",
    "url": "https://fredrikdrakelid.dev"
  },
  "hero": {
    "name": "Fredrik Drakelid",
    "role": "Full Stack Developer",
    "taglines": ["I build scalable APIs", "I craft beautiful UIs", "I ship real products"],
    "coordinates": { "lat": "48.8566° N", "lng": "2.3522° E" },
    "socials": {
      "github": "https://github.com/fredrikdrakelid",
      "linkedin": "https://linkedin.com/in/fredrikdrakelid",
      "twitter": "https://twitter.com/fredrikdrakelid"
    }
  },
  "about": {
    "bio": ["paragraph 1", "paragraph 2", "paragraph 3"],
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

### Existing files (structure unchanged)

- `src/data/projects.json` — array of Project objects
- `src/data/experience.json` — array of Experience objects

### `src/lib/types.ts`

Plain TypeScript types (no Zod, no runtime schema — the admin is a single trusted user). Shared across data utilities, components, and API routes:

```ts
export interface MetaData { title: string; description: string; url: string }
export interface HeroData {
  name: string; role: string; taglines: string[];
  coordinates: { lat: string; lng: string };
  socials: { github: string; linkedin: string; twitter: string };
}
export interface Stat { label: string; value: number; suffix: string }
export interface AboutData {
  bio: string[];  // exactly 3 elements
  stats: Stat[];
  techStack: Record<string, string[]>;  // key = category name, value = skill names
}
export interface ContactData { email: string }
export interface SiteData { meta: MetaData; hero: HeroData; about: AboutData; contact: ContactData }

export interface Project {
  id: number; title: string; description: string; image: string;
  tags: string[]; category: string; featured: boolean; accent: string;
  links: { live: string; github: string };
}
export interface Experience {
  id: number; role: string; company: string; companyUrl: string | null;
  period: string; description: string[];
}
```

### `src/lib/data.ts`

Server-only module (`import 'server-only'`). Reads JSON from disk using `fs/promises.readFile`. Reads are wrapped in Next.js `unstable_cache` with tag `"portfolio-data"`:

```ts
export const getSiteData = unstable_cache(
  async () => { /* fs.readFile + JSON.parse */ },
  ["site-data"],
  { tags: ["portfolio-data"] }
);
```

No TTL is set — data is always stale until `revalidateTag("portfolio-data")` is called by an API route after a save. Since only one admin exists, there is no stale-while-revalidate race concern.

### Atomic writes

All write operations in API routes use this pattern to avoid corruption:

```ts
const tmp = `${filePath}.tmp`;
await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
await fs.rename(tmp, filePath); // atomic on POSIX; near-atomic on Windows
```

If `writeFile` fails, the original file is untouched. If `rename` fails, the `.tmp` file is left behind (harmless).

### ID generation

IDs are always incrementing integers. New entries get `Math.max(0, ...existing.map(e => e.id)) + 1`. IDs are immutable after creation. Deleted IDs are never reused. Concurrent write protection is not needed — single-admin, no concurrent sessions by design.

### Docker volume

`src/data/` is bind-mounted in `docker-compose.yml`:

```yaml
services:
  app:
    volumes:
      - ./src/data:/app/src/data
```

The container writes as the process user. On Coolify, ensure the host directory is writable by the container user (UID 1000 by default in most Node images). This is noted as a deployment concern for the operator.

---

## 2. Authentication

### Flow

1. All requests to `/admin/*` pass through `src/middleware.ts`
2. Middleware reads the `admin_session` cookie and verifies its HMAC-SHA256 signature
3. Invalid or missing cookie → redirect to `/admin/login`
4. `/admin/login` renders a password form. On submit, `POST /api/admin/auth`
5. API route compares submitted password against `ADMIN_PASSWORD` env var (constant-time comparison)
6. On match: sets `HttpOnly; Secure; SameSite=Strict` cookie signed with `ADMIN_SECRET`, redirects to `/admin`
7. Logout: `POST /api/admin/logout` clears the cookie

### Environment variables

```
ADMIN_PASSWORD=your-password-here
ADMIN_SECRET=random-32-char-string
```

### Cookie signing

HMAC-SHA256 using `ADMIN_SECRET`. Token format: `timestamp.hmac(timestamp)`. Middleware rejects tokens older than 7 days. Session is absolute — no inactivity timeout, no auto-refresh. A new login resets the 7-day window. "Logout all devices" is out of scope (single-user, single-session).

### Files

- `src/middleware.ts` — intercepts `/admin/*`, verifies cookie, redirects if invalid
- `src/app/admin/login/page.tsx` — password form (client component)
- `src/app/api/admin/auth/route.ts` — validates password, sets signed cookie
- `src/app/api/admin/logout/route.ts` — clears cookie

---

## 3. Page & Component Refactor

**This is a breaking structural change.** Every data-consuming component currently uses either a direct JSON import or a hardcoded constant. All of these are replaced with typed props passed from a server component page.

### `src/app/page.tsx`

Remove `"use client"`. Becomes an `async` server component:

```tsx
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
      <main>
        <Hero data={site.hero} />
        <About data={site.about} />
        <Projects projects={projects} />
        <Experience experience={experience} />
        <Contact data={site.contact} />
      </main>
      <Footer />
    </>
  );
}
```

`dynamic()` imports for UI-only effects remain — they work fine in server components.

### Component prop changes

Each component retains `"use client"` but removes its hardcoded data, replacing it with a required prop:

| Component | New prop | What is removed |
|---|---|---|
| `Hero.tsx` | `data: HeroData` | `taglines` array, `socialLinks` array, coordinate strings, `codeLines` stays (decorative) |
| `About.tsx` | `data: AboutData` | `stats` array, `techStack` object, bio paragraph strings |
| `Projects.tsx` | `projects: Project[]` | `import projectsData from "@/data/projects.json"` |
| `Experience.tsx` | `experience: Experience[]` | `import experienceData from "@/data/experience.json"` |
| `Contact.tsx` | `data: ContactData` | hardcoded `email` constant |

### `src/app/layout.tsx`

Converted to an `async` server component. Calls `getSiteData()` to populate the `metadata` export and the JSON-LD schema block dynamically. Removes all hardcoded strings.

---

## 4. Admin Panel UI

### Route structure

```
src/app/admin/
  layout.tsx            — admin shell, no portfolio styles
  page.tsx              — redirect to /admin/site
  login/
    page.tsx            — password form
  site/
    page.tsx            — Hero / About / Contact & Meta editor
  projects/
    page.tsx            — project list + CRUD
  experience/
    page.tsx            — experience list + CRUD
```

### Layout

Fixed sidebar with nav links and logout. "View Site →" opens the portfolio in a new tab.

```
┌─────────────────────────────────────────┐
│  Clawfolio CMS          [View Site ↗]  │
├──────────┬──────────────────────────────┤
│ ● Site   │                              │
│ ● Projects│   [Active section]          │
│ ● Experience│                           │
│          │                              │
│ [Logout] │                              │
└──────────┴──────────────────────────────┘
```

### Site section (`/admin/site`)

Three tabs: **Hero**, **About**, **Contact & Meta**.

**Hero tab:**
- Name input (required, max 100 chars)
- Role input (required, max 100 chars)
- Taglines: ordered list, each line is a text input. Buttons to add a new tagline and delete existing ones. No drag reorder (not worth the complexity).
- Coordinates: two text inputs (lat string, lng string). Free-text, no validation beyond non-empty — matches current decorative-only usage.
- Social links: three URL inputs (GitHub, LinkedIn, Twitter). Required, no strict URL validation.

**About tab:**
- Three bio paragraph textareas (each required, no max length enforced).
- Stats: table of rows, each with value (number input), label (text input), suffix (text input). Fixed 3 rows — cannot add/remove.
- Tech stack: per category, a tag input. Users type a skill name and press **Enter** or comma to add it as a pill. Click the **×** on a pill to remove it. No reorder. No autocomplete. No duplicate check (owner's responsibility). Category names are editable text inputs. Add/remove categories with +/− buttons.

**Contact & Meta tab:**
- Email input (required)
- Page title input (required, max 70 chars — SEO guidance shown as hint)
- Meta description textarea (required, max 160 chars — character counter shown)

Each tab has its own **Save** button. On save: `PUT /api/admin/site` with the full `SiteData` body.

### Projects section (`/admin/projects`)

Grid of project cards. Each shows: title, category badge, featured indicator, Edit and Delete buttons.

"Add Project" and clicking Edit open an **inline panel** (not a modal) replacing the list:

- Title (required, max 100 chars)
- Description textarea (required, max 500 chars)
- Category: select from `["Full Stack", "Frontend", "Backend"]`
- Featured: checkbox
- Tags: pill input (Enter or comma to add, × to remove). Free text, no autocomplete.
- Accent color: `<input type="color">` with hex value shown alongside
- Live URL (required)
- GitHub URL (required)
- Image path: text input (URL string, no upload)

Cancel returns to list without saving. Save calls `POST` (new) or `PUT /api/admin/projects/[id]` (edit).

### Experience section (`/admin/experience`)

List of entries showing role, company, period. Add/Edit opens inline panel:

- Role (required, max 100 chars)
- Company name (required, max 100 chars)
- Company URL (optional, text input)
- Period: free-text input (e.g. "2023 — Present"), required
- Description bullets: list of text inputs. Add bullet (+) and remove bullet (×) buttons. At least one bullet required.

### Feedback

Top-right toast notification, 3-second auto-dismiss. Shows "Saved" on success or the error message on failure. No auto-save — all saves are explicit.

### Styling

Tailwind with existing CSS variables (`--bg-primary`, `--accent`, etc.) inheriting the dark theme. No new UI libraries.

---

## 5. API Routes

All routes under `src/app/api/admin/`. Every route except `auth` and `logout` validates the session cookie first — returns `401` if invalid. This is a second layer behind the middleware.

### Route table

| Route | Methods | Responsibility |
|---|---|---|
| `auth/route.ts` | `POST` | Validate password, set signed cookie |
| `logout/route.ts` | `POST` | Clear session cookie |
| `site/route.ts` | `GET`, `PUT` | Read / write `site.json` |
| `projects/route.ts` | `GET`, `POST` | List all / create new project |
| `projects/[id]/route.ts` | `PUT`, `DELETE` | Update / delete project by id |
| `experience/route.ts` | `GET`, `POST` | List all / create new entry |
| `experience/[id]/route.ts` | `PUT`, `DELETE` | Update / delete entry by id |

### HTTP response contract

| Scenario | Status | Body |
|---|---|---|
| Success (read) | `200` | `{ data: T }` |
| Success (write) | `200` | `{ data: T }` (updated value) |
| Invalid/missing cookie | `401` | `{ error: "Unauthorized" }` |
| Missing required field | `400` | `{ error: "field X is required" }` |
| Entity not found (PUT/DELETE) | `404` | `{ error: "Not found" }` |
| Disk write failure | `500` | `{ error: "Failed to write data" }` |

### Save flow (write routes)

1. Validate session cookie → `401` if invalid
2. Parse JSON body. Check required fields → `400` if missing
3. Read current file from disk
4. Merge/replace changes
5. Atomic write (tmp + rename)
6. Call `revalidateTag("portfolio-data")`
7. Return `{ data: updatedValue }` with `200`

---

## 6. Field Validation Reference

| Field | Required | Constraint |
|---|---|---|
| Project title | Yes | max 100 chars |
| Project description | Yes | max 500 chars |
| Project category | Yes | one of: Full Stack, Frontend, Backend |
| Project tags | No | free text, no max count |
| Project accent | Yes | valid hex color string |
| Project live URL | Yes | non-empty string |
| Project GitHub URL | Yes | non-empty string |
| Experience role | Yes | max 100 chars |
| Experience company | Yes | max 100 chars |
| Experience companyUrl | No | non-empty if provided |
| Experience period | Yes | free text |
| Experience bullets | Yes | at least 1, each non-empty |
| Hero name/role | Yes | max 100 chars each |
| Hero taglines | Yes | at least 1, each non-empty |
| Bio paragraphs | Yes | 3 paragraphs, each non-empty |
| Contact email | Yes | contains `@` |
| Meta title | Yes | max 70 chars |
| Meta description | Yes | max 160 chars |

Validation is enforced both client-side (inline error messages on form fields) and server-side (API returns `400` with field name).

---

## 7. File Manifest

### New files

| Path | Purpose |
|---|---|
| `src/data/site.json` | Hardcoded site content, now data-driven |
| `src/lib/types.ts` | Shared TypeScript types |
| `src/lib/data.ts` | Server-side data readers with caching |
| `src/middleware.ts` | Auth guard for `/admin/*` |
| `src/app/admin/layout.tsx` | Admin shell layout |
| `src/app/admin/page.tsx` | Redirect to `/admin/site` |
| `src/app/admin/login/page.tsx` | Password login form |
| `src/app/admin/site/page.tsx` | Site content editor |
| `src/app/admin/projects/page.tsx` | Projects CRUD |
| `src/app/admin/experience/page.tsx` | Experience CRUD |
| `src/app/api/admin/auth/route.ts` | Login API |
| `src/app/api/admin/logout/route.ts` | Logout API |
| `src/app/api/admin/site/route.ts` | Site data API |
| `src/app/api/admin/projects/route.ts` | Projects list/create API |
| `src/app/api/admin/projects/[id]/route.ts` | Project update/delete API |
| `src/app/api/admin/experience/route.ts` | Experience list/create API |
| `src/app/api/admin/experience/[id]/route.ts` | Experience update/delete API |

### Modified files

| Path | Change |
|---|---|
| `src/app/page.tsx` | Remove `"use client"`, become async server component, read data, pass as props |
| `src/app/layout.tsx` | Become async server component, read `site.meta` dynamically |
| `src/components/Hero.tsx` | Remove hardcoded data, accept `data: HeroData` prop |
| `src/components/About.tsx` | Remove hardcoded data, accept `data: AboutData` prop |
| `src/components/Projects.tsx` | Remove JSON import, accept `projects: Project[]` prop |
| `src/components/Experience.tsx` | Remove JSON import, accept `experience: Experience[]` prop |
| `src/components/Contact.tsx` | Remove hardcoded email, accept `data: ContactData` prop |
| `docker-compose.yml` | Add `src/data` volume bind mount |

---

## 8. Out of Scope

- Multi-user accounts or roles
- Image upload (images stay as URL strings)
- Audit log / change history
- Draft / publish workflow
- Inactivity timeout or "logout all devices"
- Drag-and-drop reordering of taglines or tech stack items
- The `src/data/az900-questions.ts` file (unrelated to portfolio, not surfaced in CMS)
