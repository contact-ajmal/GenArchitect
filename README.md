# GenArchitect — the AWS agentic architecture studio

Built for **AWS solutions architects, GenAI platform teams, and enterprise
architects** designing RAG and agentic systems on AWS. Nine RAG architectures
from a naive prototype to a secure, guardrailed, agentic multi-knowledge-base
system; visual atlases of the complete **Amazon Bedrock AgentCore** and
**Strands Agents** surfaces; downloadable end-to-end notebooks; and a composer
that generates Strands + AgentCore reference implementations and diagrams live.

> **Not affiliated with AWS.** GenArchitect is an independent educational tool,
> not affiliated with, endorsed by, or sponsored by Amazon Web Services. AWS and
> AWS service names are trademarks of Amazon.com, Inc. or its affiliates. The
> official AWS Architecture Icons are not bundled — see
> [`src/assets/aws-icons/README.md`](./src/assets/aws-icons/README.md) to add them.

The signature surface is a **synced diagram↔code walkthrough**: stepping through
a pattern lights up the relevant diagram nodes and the exact reference-code lines
together, so you can see a component and read the lines that build it. It also
ships a **downloadable notebook library** — end-to-end Jupyter notebooks for
every pattern across six enterprise scenarios, generated from the same code
fragments so nothing drifts.

## The Meridian use case

Every pattern is measured against **Meridian Financial Services**, an internal
knowledge assistant that must give grounded, cited answers over policy, product,
and compliance documents spread across S3, SharePoint, and Confluence — with
per-user access control, auditability, memory of prior questions, and room to
grow into multi-step reasoning. Reading the catalog in order tells the story of
maturing a RAG system:

`naive → managed KB → hybrid + rerank → agentic → multi-KB → graph → memory-augmented → multi-agent → guardrailed secure`

## What's inside

- **Use case** (`/use-case`) — the Meridian scenario as a progression across patterns.
- **Catalog** (`/catalog`) — all nine patterns, filterable by difficulty and AWS service.
- **Architecture detail** (`/architecture/:id`) — synced walkthrough, honest tradeoffs, Meridian tie-in, AWS building blocks, copyable reference code, and real AWS references.
- **Atlases** (`/strands`, `/agentcore`) — the complete Strands Agents and Amazon Bedrock AgentCore surfaces, taught visually in **original words** (linking to canonical docs for exact syntax), with per-atlas coverage maps. These are the single source of conceptual truth — every other surface deep-links into them.
- **Compose** (`/compose`) — a studio that assembles a RAG architecture from components and generates the matching diagram + idiomatic Strands/AgentCore reference code live.
- **Review** (`/review`) — a short adaptive interview that maps your needs to a pattern, then hands off into the composer (also generates a draw.io template).
- **Videos** (`/videos`) — a curated library of talks, demos, and deep dives, refreshed daily from trusted channels via a compliant RSS + YouTube Data API pipeline. Embedded with YouTube's player (nocookie domain, lazy-mounted); we host nothing.
- **Search** — global ⌘K search across atlas topics, patterns, notebooks, failure modes, and videos.
- **Notebooks** (`/notebooks`) — a library of downloadable end-to-end Jupyter notebooks (`.ipynb`), curated across nine patterns × six enterprise use cases, with in-app preview, generate-any-combination, and a download-all bundle. Compiled from typed cells that reuse the composer fragments — never hand-authored JSON.
- **Build track** (`/build`) — a hands-on, checkpointed path (progress saved locally) to the Meridian end-state on AgentCore + Strands.
- **Failure modes / Security / Evaluate** — a failure-mode lab, a security & compliance deep dive, and an evaluation/observability primer.
- **Playground** (`/playground`) — an optional, experimental, client-side RAG toy (lexical retrieval; bring-your-own model provider). The core app never depends on it.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** (design tokens as CSS variables) — fonts: Space Grotesk / Inter / JetBrains Mono
- **Shiki** for syntax highlighting (Python, TypeScript, bash, JSON), lazy-loaded
- **Framer Motion** (respects `prefers-reduced-motion`), **React Router**, **Zustand**, **lucide-react**, **clsx**
- Hand-built layered SVG diagram engine (`src/lib/layout.ts`) — no diagram library

## Local development

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check (tsc -b) + production build to dist/
npm run preview  # serve the production build locally
```

Data-integrity check (validates diagram/code cross-references and that all
reference URLs are well-formed):

```bash
npx tsx scripts/validate-data.ts
```

## Project layout

```
src/
  routes/        Home, UseCase, Catalog, ArchitectureDetail, Build, Playground
  components/
    ui/          Button, Card, Eyebrow, Pill, Callout, Tabs, StepDots
    code/        CodeBlock (Shiki, line highlight, copy)
    diagram/     RagDiagram, SyncedWalkthrough, AmbientSync
    notebooks/   NotebookPreview (renders cells in-app, never executes)
  compose/       composition model, rules, diagram derivation, code generation
  notebooks/     notebook engine — model, sections (reuse composer fragments), compile (nbformat 4)
  export/        scaffold zip export (reuses composer code-gen)
  data/          services, meridian, architectures/, buildTrack, verification, failureModes, security, evaluation, notebookTemplates
  lib/           layout (SVG), highlighter (Shiki), display, playground
  types.ts       the content contract
```

Dev-time validators live in `scripts/` (run with `npx tsx scripts/<name>.ts`):
`validate-data`, `compose-check`, `diagnose-check`, `failure-check`,
`scaffold-check`, `notebook-check` (structural nbformat), and `library-check`.

## Honesty & non-affiliation

GenArchitect is an **independent educational project**. It is **not affiliated
with, sponsored by, or endorsed by Amazon Web Services**. Content aims to be
accurate to Amazon Bedrock, Bedrock AgentCore, and Strands as of its build date,
and is honest about tradeoffs, cost, and security. **Every code sample is a
reference implementation** — fast-moving SDK/CLI/API syntax carries a "verify
against current AWS docs" flag and should be confirmed against the current
official documentation before use. Following the build track on a real AWS
account creates resources and incurs cost.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for static hosting options.

## Video library refresh (optional)

The video library is populated by a daily GitHub Action that reads YouTube RSS
(discovery, free) and the YouTube Data API (enrichment). It's optional — the app
works without it, showing whatever is in `data/videos.json`.

1. **Create a key:** Google Cloud Console → new project → enable **YouTube Data
   API v3** → Credentials → create an **API key**. Restrict it to that API.
2. **Add the secret:** GitHub repo → Settings → Secrets and variables → Actions →
   new secret **`YOUTUBE_API_KEY`**.
3. **Curate channels:** verify each channel id in `data/channels.json` and set
   `active: true` (RSS needs the `UC…` id, not the `@handle`).
4. **Run it:** Actions → *Refresh videos* → Run workflow (or wait for the daily
   cron). It commits `data/videos.json`, which triggers a redeploy.
5. **Locally:** `YOUTUBE_API_KEY=… node scripts/fetch-videos.mjs` (RSS-only works
   without a key). Copy `.env.example` to `.env` — never commit a real key.

**Content & attribution policy:** videos are embedded from their original
sources via YouTube's player (nocookie domain); GenArchitect does not host or
own this content, always shows the channel, and links back to the source. We
store metadata only — no full descriptions or transcripts; any summaries are our
own words. See [CURATION.md](./CURATION.md) for the human-in-the-loop workflow.
The refresh job never uses `search.list` (quota-heavy) — RSS is discovery, the
API is 1-unit `videos.list` enrichment only, and the key lives only in CI.
