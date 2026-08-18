# Visual Content Editor - Status & Setup Guide

This document describes the visual content editor project: what it is, why it
exists, what's built, and what still needs to be done to get it live. It's
written so anyone (developer, school-office staff, or a future AI assistant)
can pick up the work from here without prior context.

## The idea

Renaissance Academy's website (`racademy.org`) is a static HTML site deployed
on Netlify. Most pages are hand-written HTML, but two pages are backed by
structured JSON data:

- `/parent-resources/supply-lists/` reads `content/supply-lists.json`
- `/parent-resources/academic-calendar/` reads `content/academic-calendar.json`

Today those JSON files are edited through **Pages CMS** (`pagescms.org`), an
external hosted tool configured by `.pages.yml`. Authors log into Pages CMS
with GitHub, fill in a form, and Pages CMS commits the updated JSON to the
repo; Netlify then auto-deploys.

The goal of this project is to **replace Pages CMS with our own visual
editor**, hosted on `editor.racademy.org`, built with [Puck.js][puck] (a
React-based page-builder library). Authors get a nicer editing UI, live
preview, and the whole editor is customisable to add new content types later
(e.g. news, staff bios, events).

At the same time, this project **moves rendering from browser to build time**.
The old pages did `fetch('../../content/*.json').then(render)` in inline JS;
the new pages have the rendered HTML baked in at Netlify build time. Faster
first paint, works with JS disabled, better SEO.

[puck]: https://puckeditor.com

## Where we are now

### Done and merged (or in the open PR)

Everything code-side is in [PR #15](https://github.com/akaban01/racademy-web/pull/15)
on branch `claude/puckjs-subdomain-editing-svuwt3`.

- **Build-time HTML generation** for both content pages. `npm run build` now
  runs `scripts/build-content.mjs` before Tailwind - the script bundles
  React view components with esbuild, renders each JSON dataset with
  `react-dom/server`, and injects the HTML between `<!-- BUILD:CONTENT:*:START -->`
  / `<!-- BUILD:CONTENT:*:END -->` markers in each page.
- **Interactive JS** on those pages (supply-list checkboxes with
  `localStorage`, per-grade print buttons, calendar day-click flash,
  today-highlight) rewired to run on `DOMContentLoaded` against the
  pre-rendered markup instead of inside the old fetch callback.
- **Editor SPA** scaffolded under `editor/` - independent Vite + React +
  `@measured/puck` app, with sign-in-with-GitHub, dataset picker, and
  form-based editor screens for both existing datasets. Publishing writes
  back to `content/*.json` via the GitHub Contents API (with 409/stale-SHA
  handling).
- **GitHub OAuth exchange** as a Netlify Function
  (`editor/netlify/functions/github-oauth-exchange.js`) - the only place the
  OAuth Client Secret is used. It also verifies collaborator write access on
  the repo and refuses to return a token to non-writers.
- **Pages CMS is untouched** in this PR - `.pages.yml` is not modified.
  Pages CMS keeps working after merge because the new build script reads the
  same JSON files it produces.

### Not done - and needs a human

The editor code exists in the repo but is **not deployed anywhere yet**.
Bringing it online requires four setup steps in the GitHub/Netlify/DNS
dashboards - documented in the Next Steps section below.

## Repo layout (the parts this project added)

```
racademy-web/
├── EDITOR.md                       ← you are here
├── content-schema/                 ← shared between editor + build script
│   ├── views/
│   │   ├── SupplyListsView.jsx     React view: JSON → identical markup
│   │   ├── AcademicCalendarView.jsx  React view (highlights, year grid, months)
│   │   └── calendar-utils.js       Pure date-math helpers (no DOM)
│   ├── puck.config.jsx             Puck root-field config for both datasets
│   └── adapters.js                 to/fromPuckData in-memory envelope wrapper
│
├── scripts/
│   └── build-content.mjs           Build-time renderer; wired into npm run build
│
├── editor/                         ← standalone editor SPA (separate npm project)
│   ├── package.json                Own deps: react, react-dom, @measured/puck, vite
│   ├── vite.config.js
│   ├── index.html
│   ├── netlify.toml                base=editor, publish=dist, functions=netlify/functions
│   ├── .env.example                Env vars for local dev (mirrors Netlify site config)
│   ├── src/
│   │   ├── main.jsx, App.jsx
│   │   ├── auth/github.js          OAuth redirect + callback + sessionStorage token
│   │   ├── github/contentsApi.js   GET/PUT content/*.json via GitHub API
│   │   └── screens/
│   │       ├── SupplyListsEditor.jsx
│   │       └── AcademicCalendarEditor.jsx
│   └── netlify/functions/
│       └── github-oauth-exchange.js  Code→token exchange + collaborator check
│
├── content/                        ← unchanged - the JSON files everything reads
│   ├── supply-lists.json
│   └── academic-calendar.json
├── .pages.yml                      ← unchanged - Pages CMS config still in place
└── parent-resources/
    ├── supply-lists/index.html     ← fetch/DOM code removed; BUILD:CONTENT markers added
    └── academic-calendar/index.html    ← same treatment
```

Public site pages (about/, admissions/, our-program/, etc.) are **untouched**
by this project. React only ever runs in `editor/` and inside the Netlify
build container - it never ships to public-site visitors.

## Architecture at a glance

```
editor.racademy.org (new site, not yet deployed)
┌────────────────────────────────┐
│ editor/  Vite + React + Puck   │
│  - GitHub OAuth sign-in         │──┐
│  - Edit supply-lists JSON       │  │  GitHub Contents API
│  - Edit academic-calendar JSON  │  │  (direct commit to master)
│  - netlify function:            │  │
│    github-oauth-exchange.js     │  │
└────────────────────────────────┘  │
                                     ▼
                              ┌─────────────┐
                              │  GitHub     │
                              │  repo       │
                              │  master     │
                              └──────┬──────┘
                                     │ auto-deploy on push
                                     ▼
racademy.org (existing site)
┌────────────────────────────────────┐
│ Netlify build container runs:      │
│   npm run build                    │
│     → build-content.mjs            │
│       (JSON → HTML markers)        │
│     → tailwindcss                  │
│                                    │
│ Serves plain HTML/CSS to visitors  │
└────────────────────────────────────┘
```

## Next steps (to get the editor live)

These all happen **outside the repo** - in the GitHub, Netlify, and DNS
dashboards.

### 1. Register a GitHub OAuth App

At https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**:

- **Application name**: `Renaissance Academy Editor`
- **Homepage URL**: `https://editor.racademy.org`
- **Authorization callback URL**: `https://editor.racademy.org/callback`

Register, then generate a **Client Secret**. Save both the **Client ID**
(public) and the **Client Secret** (treat as a password) for step 3.

### 2. Add a second Netlify site for the editor

The main `racademy.org` site stays as-is. Add a **separate** Netlify site
from the same GitHub repo:

- Netlify dashboard → **Add new site** → **Import an existing project** →
  select `akaban01/racademy-web`.
- On the build settings page:
  - **Base directory**: `editor`
  - **Build command**: `npm run build`
  - **Publish directory**: `dist` (relative to base = `editor/dist`)
  - **Branch to deploy**: `master`
- Deploy.

Note the random `.netlify.app` subdomain it assigns you - you'll need it in
step 4.

### 3. Set environment variables on the editor site

In the new Netlify site's **Site configuration → Environment variables**,
add all five:

| Key | Value | Notes |
|---|---|---|
| `GITHUB_OAUTH_CLIENT_ID` | from step 1 | Server-side |
| `GITHUB_OAUTH_CLIENT_SECRET` | from step 1 | **Mark as secret** |
| `VITE_GITHUB_OAUTH_CLIENT_ID` | same as `GITHUB_OAUTH_CLIENT_ID` | Vite bundles this into the browser JS; safe (Client ID is public) |
| `GITHUB_ALLOWED_REPO` | `akaban01/racademy-web` | |
| `GITHUB_DEPLOY_BRANCH` | `master` | |

Then trigger **Clear cache and deploy site** so the new values are picked up.

### 4. Point `editor.racademy.org` at the Netlify site

- In Netlify (new site): **Domain management** → **Add custom domain** →
  `editor.racademy.org`. Netlify tells you the DNS target it wants.
- In your DNS provider (wherever `racademy.org` lives - Cloudflare,
  Namecheap, GoDaddy, etc.): add a **CNAME** record named `editor`
  pointing at the target Netlify gave you.
- Wait a few minutes; Netlify auto-provisions HTTPS.

### 5. Verify end-to-end

- Visit `https://editor.racademy.org`. Click **Sign in with GitHub**.
- GitHub prompts for repo access; approve. You should land back in the
  editor with both datasets listed.
- Open one dataset, make a small edit (e.g. rename a subject in
  supply-lists), click **Publish**.
- Watch GitHub: a new commit should appear on `master` within seconds.
- Watch Netlify (main site): a build should start automatically and finish
  in ~1 min.
- Reload `https://racademy.org/parent-resources/supply-lists/` - the edit
  should be live.

**Debugging tips** if step 5 fails:
- OAuth callback errors → the callback URL in step 1 must **exactly** match
  `https://editor.racademy.org/callback` (including the `/callback`).
- 403 on publish → the logged-in GitHub user isn't a collaborator with
  write access on the repo. Add them at
  https://github.com/akaban01/racademy-web/settings/access.
- Server errors on `/api/github-oauth-exchange` → check the editor site's
  **Logs → Functions** in Netlify; usually a missing/misnamed env var
  from step 3.

### 6. (Optional) Retire Pages CMS

Once step 5 works and the new editor is used for real edits, you can retire
Pages CMS to avoid two tools writing the same files:

- Delete `.pages.yml` from the repo (or just remove its two entries).
- Optionally revoke the Pages CMS GitHub App on the repo.

Not required - Pages CMS and the new editor coexist safely as long as you
avoid concurrent edits.

## Local development

Everything works locally too - useful for iterating on the editor UI or the
render output without deploying.

**Root site** (build-time content generation):

```
npm install
npm run build    # runs build-content.mjs then tailwindcss
npm run serve    # local http-server on :8080
```

Open `http://localhost:8080/parent-resources/supply-lists/` to sanity-check
the generated markup. Any change to `content/*.json` or to
`content-schema/views/*` requires a re-run of `npm run build`.

**Editor SPA** (in a separate terminal):

```
cd editor
npm install
cp .env.example .env    # then fill in real values (see below)
npm run dev             # Vite dev server on :5173
```

For local OAuth to work, you'll need to either:

- Register a **second** GitHub OAuth App with callback
  `http://localhost:5173/callback`, or
- Use Netlify Dev (`netlify dev` inside `editor/`) to run the OAuth function
  locally against the real GitHub OAuth App if you point its callback at
  your local URL temporarily.

## Rollback

The whole PR is safe to revert if something goes wrong:

- `git revert <merge commit>` restores the old fetch-based pages, removes
  the build-content step, and leaves `editor/` in place (harmless - it's
  not deployed anywhere).
- No JSON file is modified by this PR, so Pages CMS continues to work
  through the revert.

## Key files to know

If a fresh session picks this up, these are the files most worth reading
first:

- `EDITOR.md` (this file) - the map
- `content-schema/views/SupplyListsView.jsx` and `AcademicCalendarView.jsx` -
  the single source of truth for rendered markup
- `scripts/build-content.mjs` - the build-time renderer
- `editor/src/App.jsx` - editor routing and screens
- `editor/netlify/functions/github-oauth-exchange.js` - OAuth + permission gate
- `editor/src/github/contentsApi.js` - publish flow (GET SHA → PUT with SHA)

The original planning document lives at
`/root/.claude/plans/is-it-possible-to-cached-wadler.md` in the session that
built this - it's the fullest reference for the design decisions and their
rationale.
