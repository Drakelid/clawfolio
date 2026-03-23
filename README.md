This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Docker Compose

Create a `.env` file in the project root:

```env
ADMIN_PASSWORD=changeme
ADMIN_SECRET=changeme-32-char-random-string-here
```

Then build and run the app with Docker Compose:

```bash
docker compose up --build
# or, on systems with the legacy binary:
docker-compose up --build
```

The app will be available at [http://localhost:81](http://localhost:81).

Notes:

- The container runs the production server with `next start`.
- `./src/data` is bind-mounted into the container, so CMS edits persist across restarts.
- The repo pins a larger Node heap for `dev`/`build`/`start` to avoid JavaScript out-of-memory crashes during Next.js compilation.
- Stop the stack with `docker compose down`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
