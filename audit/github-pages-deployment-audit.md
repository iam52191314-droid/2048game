# GitHub Pages Deployment Readiness Audit

Project: Infinite 2048 (Vite + React)

Scope: GitHub Pages **project site** deployed from **main** branch via GitHub UI (no Actions, no custom domain).

## Deployment assumptions checked

- Static hosting only (no server runtime).
- Site served from a **subpath**: `https://username.github.io/repo-name/` (project site).
- Build artifacts must be present in the repository for Pages to serve (no CI build).

Sources reviewed: [`package.json`](package.json:1), [`vite.config.ts`](vite.config.ts:1), [`index.html`](index.html:1), [`App.tsx`](App.tsx:1), [`index.tsx`](index.tsx:1), [`.env.local`](.env.local:1), [`.gitignore`](.gitignore:1).

## Issues that **must** be fixed to deploy

### 1) Build output is not published for Pages (no Actions, main branch)

- **Problem**: GitHub Pages is configured to serve from the repository, but the built site is **not present** in the repo. Vite outputs to `dist/` by default, and `dist` is ignored in [`.gitignore`](.gitignore:1). There is no `/docs` folder or build step committed.
- **Why it affects GitHub Pages**: GitHub Pages does not build Vite projects on its own. When deploying from the main branch via UI, it serves **existing static files** only. If build artifacts aren’t committed in the configured folder, Pages will serve a 404 or an empty site.
- **High‑level fix**: Choose a Pages‑compatible publish directory and ensure it contains the built assets.
  - Option A: Configure Vite build output to `/docs` and commit `/docs` to the repo, then set Pages to serve from `/docs`.
  - Option B: Commit `dist/` and configure Pages to serve `/dist` (not the usual Pages UI option).

### 2) Absolute asset/script paths will break under a repo subpath

- **Problem**: [`index.html`](index.html:1) uses absolute paths: `/index.css` and `/index.tsx`. These resolve to the domain root, not the repo subpath.
- **Why it affects GitHub Pages**: On a project site, the app is served from `https://username.github.io/repo-name/`. Absolute `/index.css` maps to `https://username.github.io/index.css` which does not exist, causing the app to load without JS/CSS.
- **High‑level fix**: Use a correct `base` path for Vite and/or use relative asset paths in HTML so they resolve under the repo subpath.

## Issues that are **recommended** to fix

### 3) Client‑side exposure of `GEMINI_API_KEY`

- **Problem**: [`vite.config.ts`](vite.config.ts:1) defines `process.env.GEMINI_API_KEY` using `.env.local`. This injects the value into the **client bundle** at build time, and `.env.local` is not intended for public secrets.
- **Why it affects GitHub Pages**: GitHub Pages is static hosting only. Any secret compiled into client code is **public** and can be extracted by students or visitors. If the app ever uses this key in the browser, it will be exposed.
- **High‑level fix**: Remove client‑side secret usage. Use only public keys or move API usage to a backend (not available on Pages), or remove the feature for static deployment.

### 4) No explicit `base` configured for Vite project sites

- **Problem**: [`vite.config.ts`](vite.config.ts:1) does not define `base`. Vite defaults to `/`, which is correct for a root domain but **not** for a repo subpath.
- **Why it affects GitHub Pages**: Asset URLs in the build output will point to `/assets/...`, breaking in a project‑site deployment.
- **High‑level fix**: Set Vite `base` to `./` or `/repo-name/` for Pages. This ensures built asset URLs resolve correctly.

## Things that are **safe as‑is**

- **No server‑only APIs**: The app is fully client‑side; there are no server‑only API calls or SSR assumptions in [`App.tsx`](App.tsx:1).
- **No client‑side routing**: No React Router or dynamic routes found, so there are no history‑based routing issues for Pages.
- **Local storage**: Use of `localStorage` in [`App.tsx`](App.tsx:1) is compatible with static hosting.
- **External CDN resources**: Tailwind CDN and Google Fonts are referenced in [`index.html`](index.html:1). This is acceptable for GitHub Pages as long as network access is available.

## Student‑friendly deployment checklist (GitHub UI only)

1) Ensure build output is committed to the repo in the folder GitHub Pages will serve.
2) Confirm Vite `base` is set for a project site (repo subpath).
3) Avoid absolute `/` paths in [`index.html`](index.html:1) or assets.
4) Verify no secret API keys are embedded in client code.
5) In GitHub Settings → Pages, select **main** branch and the correct folder (commonly `/docs`).

