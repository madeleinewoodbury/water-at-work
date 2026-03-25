# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **This is NOT the Next.js you know.** This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured.

## Stack

- **Next.js 16.2.1** with App Router (`app/` directory)
- **React 19.2.4** — server components by default
- **TypeScript 5** — strict mode, `@/*` path alias maps to project root
- **Tailwind CSS 4** — configured via `@tailwindcss/postcss` (v4 syntax differs from v3)
- **ESLint 9** — flat config format (`eslint.config.mjs`)
- **Supabase** — Postgres + Auth + RLS; `@supabase/ssr` for SSR session handling
  - Server client: `lib/supabase/server.ts` (`createServerClient`)
  - Browser client: `lib/supabase/client.ts` (`createBrowserClient`)
  - DB schema: `supabase/schema.sql` — run top-to-bottom in the Supabase SQL editor

## Architecture

Uses the Next.js App Router. All routes live under `app/`. Layouts are defined via `layout.tsx` files; pages via `page.tsx`. Server components are the default — add `"use client"` only when needed.

Before adding routes, data fetching, caching, or mutations, read the relevant guide in `node_modules/next/dist/docs/01-app/01-getting-started/`.

**Middleware** lives in `proxy.ts` (not `middleware.ts`) — Next.js 16 renamed it.

**Auth flow** — after email confirmation, `app/auth/callback/route.ts` redirects new users to `/onboarding` (not `/dashboard`). The onboarding page collects `display_name` and `daily_goal`, then redirects to `/dashboard`. If `display_name` is already set, `/onboarding` skips straight to `/dashboard`. Existing users signing in go directly to `/dashboard` via `signIn()` in `app/auth/actions.ts`.

**Server actions** live alongside their route: `app/[route]/actions.ts`, marked `'use server'`. Dashboard actions do **not** call `revalidatePath()` — real-time subscriptions handle UI updates instead.

**Real-time** — The dashboard uses Supabase real-time subscriptions (`postgres_changes`) on `intake_logs`, `opt_outs`, and `users`. The server component (`app/dashboard/page.tsx`) fetches initial data and passes it to `DashboardRealtime` (client wrapper), which manages state via `useState`/`useMemo` and subscribes to changes. Both tables have `REPLICA IDENTITY FULL` and are added to the `supabase_realtime` publication (see `supabase/migrations/003_enable_realtime.sql`). A `WowOverlay` component shows a random Owen Wilson GIF (from `public/wow/`) on every new water log.

**Team opt-outs** — After 12:00 PM, teammates can sit out users who have zero water logged for the day. The `opt_outs.opted_out_by` column tracks who initiated the opt-out (`opted_out_by = user_id` for self, different UUID for team). The sat-out user sees "A teammate sat you out" (anonymous) and can opt back in. The actor who initiated it sees an "Undo" button. RLS policies: the actor (`opted_out_by`) can insert and delete; the subject (`user_id`) can also delete (opt back in). The cutoff hour is defined as `CUTOFF_HOUR` in both `app/dashboard/actions.ts` and `components/dashboard/DashboardRealtime.tsx`.

**shadcn/ui** uses the Base Nova preset (`@base-ui/react` primitives). `button.tsx` is `"use client"` — do not import `buttonVariants` in server components; use plain Tailwind classes instead.

**ESLint** enforces `react-hooks/set-state-in-effect` — calling `setState` synchronously inside `useEffect` is an error. Use `useTransition` for async state updates tied to server actions.

**React 19 type changes** — `React.FormEvent` is deprecated. Use `React.SyntheticEvent<HTMLFormElement>` for form submit handlers instead.
