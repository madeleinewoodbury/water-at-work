# Water at Work

A team hydration tracker. Members log water intake throughout the day and see the whole team's progress on a shared dashboard.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS 4
- Supabase (Postgres + Auth + Storage + Realtime)

---

## Project setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. In **Storage**, create a bucket named exactly `avatars` and set it to **Public**.
3. In the **SQL Editor**, run `supabase/schema.sql` top to bottom. This creates all tables, RLS policies, triggers, and enables real-time.

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from your Supabase project settings:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role key |
| `NEXT_PUBLIC_SITE_URL` | Your app's base URL (e.g. `http://localhost:3000` for local dev) |

> `SUPABASE_SERVICE_ROLE_KEY` is secret — never expose it in the browser or commit it.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Development with seed data

The seed script creates 4 test users with 21 days of realistic intake history so the dashboard has something to show immediately.

**Seed the database:**

```bash
npm run seed
```

This will:
- Delete all existing users (cascades to all their data)
- Create Alice, Bob, Carol, and Dave (`password123`)
- Insert ~21 days of intake logs per user

**Re-seed at any time** — the script resets everything first, so it's safe to run repeatedly.

> The script is blocked from running against production (`NODE_ENV === 'production'` throws an error).

### Test accounts

| Email | Password |
|---|---|
| alice@example.com | password123 |
| bob@example.com | password123 |
| carol@example.com | password123 |
| dave@example.com | password123 |

---

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run seed     # Reset and seed dev database
```

---

## Deployment

1. Create a separate production Supabase project and repeat the setup steps above.
2. Set all environment variables on your host (`NEXT_PUBLIC_SITE_URL` should be your production domain).
3. Deploy — Vercel is recommended (connect your GitHub repo or run `vercel --prod`).

Do not run `npm run seed` against production.
