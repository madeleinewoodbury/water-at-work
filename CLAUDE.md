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

## Architecture

Uses the Next.js App Router. All routes live under `app/`. Layouts are defined via `layout.tsx` files; pages via `page.tsx`. Server components are the default — add `"use client"` only when needed.

Before adding routes, data fetching, caching, or mutations, read the relevant guide in `node_modules/next/dist/docs/01-app/01-getting-started/`.
