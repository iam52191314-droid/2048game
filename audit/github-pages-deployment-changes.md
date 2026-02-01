# GitHub Pages Deployment Changes (Student Guide)

This document explains **exactly what was changed** to make this project deployable as a GitHub Pages **project site** from the **main** branch, using the **/docs** folder in Settings → Pages.

Use this alongside the audit report in [audit/github-pages-deployment-audit.md](audit/github-pages-deployment-audit.md).

## 1) Configure Vite to build into `/docs` and use a project‑site base path

**What was changed**

- In [vite.config.ts](vite.config.ts:1):
  - Set `base` to `./` so built assets resolve correctly under a repo subpath.
  - Set `build.outDir` to `docs` so build output lands in `/docs` (the folder GitHub Pages can serve from the main branch).

**Why**

- GitHub Pages project sites live at `https://username.github.io/repo-name/`, not the domain root. Asset URLs must be relative or use the repo subpath.
- GitHub Pages doesn’t run a build step when serving from the main branch. It only serves **existing static files**. Putting the build output in `/docs` makes it easy to serve via Settings → Pages.

## 2) Remove client‑side secret injection

**What was changed**

- In [vite.config.ts](vite.config.ts:1):
  - Removed `loadEnv` and the `define` block that injected `process.env.GEMINI_API_KEY` into the client bundle.

**Why**

- GitHub Pages is static hosting. Any “secret” injected into the client bundle becomes public.
- The game itself doesn’t require a secret key, so this was removed to avoid accidental exposure.

## 3) Fix HTML asset paths to be relative

**What was changed**

- In [index.html](index.html:1):
  - `/index.css` → `./index.css`
  - `/index.tsx` → `./index.tsx`

**Why**

- Absolute paths (`/index.css`) resolve to the domain root (`https://username.github.io/index.css`) and break on project sites.
- Relative paths (`./index.css`) resolve under the repo subpath (`https://username.github.io/repo-name/index.css`).

## 4) Build the site so `/docs` exists and is committed

**What was done**

- Ran the build using the project script: `npm run build`.
- Vite generated production assets into `/docs`.

**Why**

- GitHub Pages needs the static files present in the repo to serve the site.

## Student deployment steps (GitHub UI only)

1) Run `npm install` (one time).
2) Run `npm run build` (generates `/docs`).
3) Commit and push the `/docs` folder.
4) In GitHub → **Settings → Pages**, set:
   - **Source**: `main` branch
   - **Folder**: `/docs`
5) Visit `https://username.github.io/repo-name/`.

