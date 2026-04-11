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
  - Admin client: `lib/supabase/admin.ts` (`supabaseAdmin`) — service role, bypasses RLS; use for cross-user writes and server-side admin operations
  - DB schema: `supabase/schema.sql` — run top-to-bottom in the Supabase SQL editor on a fresh project

## Architecture

Uses the Next.js App Router. All routes live under `app/`. Layouts are defined via `layout.tsx` files; pages via `page.tsx`. Server components are the default — add `"use client"` only when needed.

Before adding routes, data fetching, caching, or mutations, read the relevant guide in `node_modules/next/dist/docs/01-app/01-getting-started/`.

**Middleware** lives in `proxy.ts` (not `middleware.ts`) — Next.js 16 renamed it.

**Auth flow** — after email confirmation, `app/auth/callback/route.ts` redirects new users to `/onboarding` (not `/dashboard`). The onboarding page collects `display_name` and `daily_goal`, then redirects to `/teams` so new users can create or join a team. If `display_name` is already set, `/onboarding` redirects to `/dashboard` (has team) or `/teams` (no team). Existing users signing in go directly to `/dashboard` via `signIn()` in `app/auth/actions.ts`.

**Server actions** live alongside their route: `app/[route]/actions.ts`, marked `'use server'`. Dashboard actions do **not** call `revalidatePath()` — real-time subscriptions handle UI updates instead.

**Real-time** — The dashboard uses Supabase real-time subscriptions (`postgres_changes`) on `intake_logs`, `opt_outs`, and `users`, filtered by `team_id` when the user is on a team. The server component (`app/dashboard/page.tsx`) fetches initial data and passes it to `DashboardRealtime` (client wrapper), which manages state via `useState`/`useMemo` and subscribes to changes. All subscribed tables have `REPLICA IDENTITY FULL` and are in the `supabase_realtime` publication. A `WowOverlay` component shows a random Owen Wilson GIF (from `public/wow/`) on every new water log.

**Teams** — Users belong to at most one team at a time (`users.team_id`, `users.team_role`). Activity tables (`intake_logs`, `opt_outs`, `daily_goal_overrides`) have a nullable `team_id` stamped at write time. Dashboard and history queries are scoped by `team_id` when the user has a team, or by `user_id` for personal-only tracking. Routes live under `app/teams/`; components under `components/teams/`.

- Team actions (`app/teams/actions.ts`): `createTeam`, `updateTeam`, `requestToJoin`, `cancelRequest`, `approveRequest`, `rejectRequest`, `kickMember`, `leaveTeam`, `deleteTeam`.
- Cross-user writes (approving members, kicking, promoting to admin) must use `supabaseAdmin` — RLS only allows users to update their own row.
- Admin succession: when an admin leaves or deletes their account, the oldest remaining member (by `created_at`) is promoted. If the admin is the sole member, the team is deleted.
- `deleteTeam` must delete the team row **before** clearing memberships — the DELETE RLS policy checks `users.team_id`, which would be null if memberships are cleared first.

**RLS — infinite recursion pitfall** — Policies on `users` that subquery `users` (e.g. `SELECT team_id FROM users WHERE id = auth.uid()`) cause infinite recursion. All team-context lookups inside RLS policies use two `SECURITY DEFINER` helper functions defined in `supabase/migrations/013_team_scoped_rls.sql`:
- `public.get_auth_user_team_id()` — returns current user's `team_id`
- `public.is_current_user_team_admin(team_id UUID)` — returns boolean

Any new team-scoped RLS policy must use these functions, not inline subqueries on `users`.

**Team opt-outs** — After 12:00 PM, teammates can sit out users who have zero water logged for the day. The `opt_outs.opted_out_by` column tracks who initiated the opt-out (`opted_out_by = user_id` for self, different UUID for team). The sat-out user sees "A teammate sat you out" (anonymous) and can opt back in. The actor who initiated it sees an "Undo" button. RLS policies: the actor (`opted_out_by`) can insert and delete; the subject (`user_id`) can also delete (opt back in). The cutoff hour is defined as `CUTOFF_HOUR` in both `app/dashboard/actions.ts` and `components/dashboard/DashboardRealtime.tsx`.

**Inactive user deactivation** — Users with no water logged and no self-initiated opt-outs for 7 consecutive days are automatically marked `is_active = false` in `public.users`. A Vercel Cron job (`vercel.json`) calls `GET /api/cron/deactivate-inactive` daily at 6:00 AM UTC, which invokes the `deactivate_inactive_users()` Postgres function (see `supabase/migrations/010_user_is_active.sql`). Self opt-outs (`opted_out_by = user_id`) count as activity; team opt-outs (`opted_out_by = teammate`) do not. Inactive users are filtered out of the team dashboard via `getCachedTeamUsers()` and real-time handlers in `DashboardRealtime`. When an inactive user logs water, `logIntake()` in `app/dashboard/actions.ts` automatically reactivates them (`is_active = true`). The cron route is secured with the `CRON_SECRET` environment variable.

**Notifications** — In-app notifications for team events live in `public.notifications`. Created server-side via `supabaseAdmin` in `app/teams/actions.ts` (join request → admin notified; approved/rejected → requester notified; team deleted → members notified). The `NotificationBell` component (`components/NotificationBell.tsx`) is a client component that receives initial data from the Navbar server component and subscribes to real-time changes filtered by `user_id`. Notification server actions live in `app/notifications/actions.ts`.

**shadcn/ui** uses the Base Nova preset (`@base-ui/react` primitives). `button.tsx` is `"use client"` — do not import `buttonVariants` in server components; use plain Tailwind classes instead.

**ESLint** enforces `react-hooks/set-state-in-effect` — calling `setState` synchronously inside `useEffect` is an error. Use `useTransition` for async state updates tied to server actions.

**React 19 type changes** — `React.FormEvent` is deprecated. Use `React.SyntheticEvent<HTMLFormElement>` for form submit handlers instead.

## Database migrations

Migrations live in `supabase/migrations/` and must be run in numeric order. `supabase/schema.sql` is the authoritative full-schema file for fresh deployments — it must always reflect the final state of all migrations. When adding a new migration, update `schema.sql` to match.

Key ordering constraints in `schema.sql`:
1. `teams` table first (users has a FK to it), but only basic SELECT/INSERT policies
2. `users` table second
3. RLS helper functions third (they reference `users`, which now exists)
4. `teams` admin policies + `users` teammate policy fourth (they use the helpers)
5. `deactivate_inactive_users()` function after both `intake_logs` and `opt_outs` are defined (it references both)
