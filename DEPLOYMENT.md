# Deploying GenArchitect

GenArchitect is a **fully static single-page app**. There is no server, no
backend, and no secrets: `npm run build` emits a static bundle to **`dist/`**
that any static host can serve. (The optional `/playground` uses client-side
configuration only — a user-supplied endpoint or the in-artifact fetch pattern —
so it never needs server secrets either.)

Because it's an SPA using client-side routing, every host needs a **fallback
that serves `index.html` for unknown paths** so deep links like
`/architecture/agentic_rag` work on refresh.

```bash
npm run build     # output → dist/
npm run preview   # sanity-check the production build locally
```

## Base path

The app is configured for **root-domain** hosting (`base: '/'` in
`vite.config.ts`). If you serve it under a sub-path (e.g.
`https://host/genarchitect/`):

1. Set `base: '/genarchitect/'` in `vite.config.ts`.
2. Pass the same value as `basename` to `<BrowserRouter>` in `src/main.tsx`:
   `<BrowserRouter basename="/genarchitect">`.
3. Rebuild.

---

## Option A — Amazon S3 + CloudFront

1. **Create a bucket** and build:

   ```bash
   npm run build
   aws s3 sync dist/ s3://YOUR_BUCKET --delete
   ```

2. **Serve via CloudFront** with Origin Access Control (keep the bucket
   private). Set the **Default root object** to `index.html`.

3. **SPA routing fallback** — add a CloudFront **custom error response** so
   client-side routes resolve:

   - HTTP error code `403` (and `404`) → **Response page path** `/index.html`,
     **HTTP Response code** `200`.

4. **Invalidate** the cache after each deploy:

   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DIST_ID \
     --paths "/*"
   ```

> Long-hashed assets in `dist/assets/*` are safe to cache aggressively;
> `index.html` should be short-cached so new deploys are picked up.

---

## Option B — AWS Amplify Hosting

1. Connect the Git repository in the Amplify console.
2. Build settings (`amplify.yml`):

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **SPA routing fallback** — add a rewrite rule (Amplify console → Rewrites and
   redirects):

   - Source `/<*>` → Target `/index.html` → Type `200 (Rewrite)`.

---

## Option C — Cloudflare Pages (Git-connected)

The repo already includes what Cloudflare needs: `public/_redirects` (SPA
fallback, copied to `dist/` on build) and `.nvmrc` pinning Node 22 (Vite 8
requires Node ≥ 20.19 / 22.12; Cloudflare's default is too old).

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, and pick the `GenArchitect` repo.
2. Build settings:
   - **Framework preset:** Vite (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variable:** `NODE_VERSION` = `22` (belt-and-suspenders with `.nvmrc`)
3. **Save and Deploy.** Every push to `main` redeploys automatically; PRs get
   preview URLs.

> **Do not put `[skip ci]` in a commit message.** Cloudflare Pages honours it
> and reports *"The deployment was skipped because the commit message contained
> a CI skip directive."* The nightly data-refresh jobs deliberately omit it —
> otherwise they commit fresh `videos.json` / `updates.json` that never reaches
> the live site, and the library only updates when an unrelated commit happens
> to follow. The refresh workflows run on `schedule`/`workflow_dispatch` only,
> never on `push`, so nothing needs suppressing.
>
> The match is against the **entire commit message, body included** — not just
> the subject line. So do not even *quote* the directive when writing a commit
> message about it (spell it `skip-ci`, or describe it in words). A commit whose
> body merely mentioned it in prose was silently skipped.

SPA deep links (e.g. `/architecture/agentic_rag`) work via `public/_redirects`:

```
/*  /index.html  200
```

CLI alternative (Wrangler):

```bash
npm run build
npx wrangler pages deploy dist --project-name genarchitect
```

## Option D — Any static host (Vercel / Netlify / GitHub Pages / …)

Build command `npm run build`, output/publish directory `dist`.

- **Vercel** — a `vercel.json` fallback:

  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

- **Netlify** — a `public/_redirects` file (copied into `dist/` on build):

  ```
  /*  /index.html  200
  ```

- **GitHub Pages** — Pages serves from a sub-path, so set `base` +
  `basename` (see **Base path** above). Provide a `404.html` that is a copy of
  `index.html` for SPA fallback.

---

## Notes

- No environment variables or secrets are required to build or run the app.
- The bundle is fully client-side; there is nothing to scale or secure
  server-side.
- If you enable the optional playground with a custom endpoint, that endpoint
  (your proxy) is where any model-provider credentials live — never in this app.
