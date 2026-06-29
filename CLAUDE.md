# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000 in container, mapped to 5173 externally)
npm run build    # Production build
npm run lint     # ESLint check
```

There is no test suite. To verify changes, run `npm run dev` and test in the browser.

## Local setup

Copy `.example.env.local` to `.env.local` and fill in values. The recommended workflow is VSCode Dev Container (Docker):

```bash
copy .example.env.local .env.local
# Then: Cmd/Ctrl+Shift+P → "Reopen in Container"
npm install && npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_SCHEMA` | `dev` or `prod` (controls which DB schema is active) |
| `NEXT_PUBLIC_SITE_URL` | Base URL (e.g. `http://localhost:5173`) |
| `NEXT_PUBLIC_YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `GROQ_API_KEY` | Groq API key for AI recommendations (server-side only) |

## Architecture

**Stack:** Next.js (App Router) + Supabase (auth + DB) + Tailwind CSS v4

### Data flow pattern

Server components fetch data and pass it to `"use client"` counterparts. Example: `app/page.tsx` (server) calls `getPosts()` and renders `<HomePageClient posts={posts} />`. Avoid fetching in client components when the data can be server-rendered.

### Key directories

- `app/lib/` — shared utilities: `supabaseClient.ts` (singleton client), `postService.ts` (all DB queries), `userService.ts` (user sync on auth), `moods.ts` (mood constants with emoji/color/gradient), `useSupabaseUser.ts` (auth hook)
- `app/components/` — shared UI components
- `app/api/` — Next.js Route Handlers: `/api/youtube/search` (proxies YouTube Data API), `/api/ai/recommend` (Groq-powered recommendations using llama-3.3-70b)

### Supabase schema isolation

The DB has `dev` and `prod` schemas (mirroring `public`). `NEXT_PUBLIC_SUPABASE_SCHEMA` determines which schema the client targets. All queries in `postService.ts` hit the schema specified at client init time in `supabaseClient.ts`.

### Auth

Supabase Auth with Google OAuth. `useSupabaseUser` hook subscribes to auth state changes and calls `syncUserToPublicTable()` on login to write the user into the schema's `users` table. Auth is client-side only — server components do not have access to the session.

### AI recommendations

`/api/ai/recommend` (POST) fetches recent posts from Supabase, constructs a prompt with post titles and moods, and calls Groq (`llama-3.3-70b-versatile`) to return up to 5 post recommendations. Requires `GROQ_API_KEY`.

### Mood system

All moods are defined in `app/lib/moods.ts` as a `const` array. Each mood has `label`, `emoji`, `color` (Tailwind classes), `gradient`, and `iconColor`. Helper functions `getMoodStyle`, `getMoodEmoji`, `getMoodPlayerGradient`, `getMoodPlayerIconColor` look up by label string.

### YouTube search

`/api/youtube/search` proxies YouTube Data API v3 to keep the API key server-side. The modal (`YouTubeSearchModal.tsx`) debounces input (400ms) and calls this route.

## DB schema

Three tables in each schema (`users`, `posts`, `likes`):
- `users`: `id (uuid PK)`, `name`, `email`, `avatar_url`, `banner_url`
- `posts`: `id`, `user_id → users.id`, `mood`, `video_id`, `video_title`, `video_url`
- `likes`: `id`, `post_id → posts.id`, `user_id → users.id` (unique constraint on pair)

RLS is enabled. Posts and likes are publicly readable; inserts require authentication; deletes are owner-only.

`next.config.ts` whitelists `img.youtube.com`, `i.ytimg.com`, and `*.supabase.co` for `next/image`.
