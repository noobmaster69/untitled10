# Habit Tracker

Track your daily habits with a GitHub-style heatmap.

**Live app:** https://untitled10-nurw.vercel.app

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Prisma](https://www.prisma.io) ORM
- [Neon](https://neon.tech) serverless Postgres
- [TanStack Query](https://tanstack.com/query) for client-side data fetching
- Deployed on [Vercel](https://vercel.com)

## Features

- Create habits (yes/no or counted with a daily target), each with its own color
- GitHub-style contribution heatmap per habit and across all habits
- Current and longest streak tracking, 30-day completion stats
- Click any heatmap day to toggle completion
- Dark mode support

## Deployment

The Vercel project **`untitled10-nurw`** is connected to this repository:
every push to `main` triggers a production deployment automatically.

Required environment variable (set in Vercel → Project → Settings →
Environment Variables, never committed to this repo):

| Name           | Value                                  |
| -------------- | -------------------------------------- |
| `DATABASE_URL` | Neon Postgres connection string        |

> ⚠️ Keep exactly **one** Vercel project connected to this repo. Importing
> the repo again in Vercel creates an additional project with its own URL
> and its own (empty) env vars — that's how this repo once ended up with
> five half-working deployments.

## Local development

```bash
npm install
# create .env with DATABASE_URL=<your Neon connection string>
npx prisma migrate deploy   # apply schema to the database
npm run dev                 # http://localhost:3000
```

## Project structure

```
app/            pages (dashboard, habit detail, settings) and API routes
components/     heatmap and habit UI components
lib/            Prisma client, date/streak/color helpers
prisma/         schema and migrations
```
