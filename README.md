# Pacer

The real, in-progress build of Pacer, a running-buddy matching app. This replaces the
static HTML prototype (`pacer-prototype.html`) as the actual codebase going forward.

## Stack

- **Next.js** (App Router) — framework, routing, deploys straight to Vercel
- **Tailwind CSS v4** — styling, using Pacer's actual design tokens (see below)
- **Supabase** — database, wired up for Discover; auth and realtime chat come next
- **Mapbox** — location/maps (not wired up yet)

## Running it locally

1. **Set up Supabase** (takes about 2 minutes):
   - Create a free project at [supabase.com](https://supabase.com)
   - Go to the **SQL Editor** in your new project, paste in the contents of `supabase/schema.sql`, and run it. This creates the `runs` table and seeds it with the same four sample runs the prototype used.
   - Go to **Project Settings → API**, copy your **Project URL** and **anon public key**
2. **Set up your local environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   Then paste your Project URL and anon key into `.env.local`. This file is gitignored, it never gets committed.
3. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```

Then open [http://localhost:3000](http://localhost:3000). Requires an internet connection
on first run so Next.js can fetch the Google Fonts (Space Grotesk, Inter, IBM Plex Mono).

**Deploying to Vercel:** add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project's Settings → Environment Variables,
using the same values from your `.env.local`. Without them, the deployed site will show
the "Couldn't load runs" error state instead of real data.

## Design tokens

Pacer's color palette and fonts are defined once, in `src/app/globals.css`, as CSS
custom properties wired into Tailwind's `@theme`. This means classes like `bg-accent`,
`text-muted`, `border-line`, and `font-display` are all real Tailwind utilities now,
not one-off hex codes. If the palette ever changes, it only needs to change in one place.

| Token | Value | Use |
|---|---|---|
| `bg` | `#12181D` | Page background |
| `bg-elevated` | `#1B232B` | Cards |
| `bg-elevated-2` | `#222C35` | Nested/secondary surfaces |
| `text` | `#F3F1E9` | Primary text |
| `muted` | `#8B96A3` | Secondary text |
| `accent` | `#D6FF3F` | Hi-vis accent (brand color) |
| `accent-warm` | `#FF6B4A` | Warm accent (pass/warning) |
| `accent-blue` | `#6FB7FF` | Blue accent (easier-pace badge) |
| `line` | `#2A333C` | Borders/dividers |

## What's built so far

- **Discover screen**: the swipeable run-card deck, with real React state driving the
  drag/swipe interaction (no more manually rewriting HTML strings like the prototype did)
- Pace-match badges, calculated live against a mock pace range
- The pace-matched-only filter toggle
- **Real data**: Discover reads live from a Supabase Postgres database (`supabase/schema.sql`),
  not a hardcoded file anymore

## What's still mock or missing

- No real accounts yet, `paceRange` (used for match badges) is still a hardcoded default
  in `src/lib/mockData.js`, not tied to a logged-in user
- `joined` is stored as a plain text array on each run row for now, a temporary
  simplification. It becomes a real join table once user accounts exist, so "who's
  going" can reference actual people instead of initials
- Posting a run, capacity/waitlist enforcement, Matches, Profile, and all the safety
  features (verification, live location sharing, report/block) still need to be rebuilt
  as real, database-backed screens

## Status

🚧 Early build, Discover screen only, now backed by a real Supabase database. Auth,
Post a Run, Matches, Profile, and the safety features (verification, live location
sharing, report/block) all still need to be rebuilt as real screens. See
`pacer-requirements-and-timeline.md` in the main project docs for the phased plan.

## Run chat and My runs

Joined and hosted runs live under **My runs** (`/runs`). Each run has a page
(`/runs/[id]`) with the meeting place (Open in Google Maps), who's going, and a
group chat limited to the host and the people who joined.

Chat needs one extra table. In the Supabase SQL Editor, run
`supabase/0003_run_chat.sql` once, after `schema.sql` and
`0002_auth_and_joins.sql`.
