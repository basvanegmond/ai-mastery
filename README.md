# AI Mastery

Personal competency development tool for AI tool usage. A coaching system built to move a single user (Bas) from roughly 85th-percentile to 99th-percentile AI tool usage through deliberate practice and honest, evidence-based feedback — not content consumption.

It replaces a sandboxed single-file claude.ai Artifact with a real deployed app: Vite + React + TypeScript + Tailwind frontend on Cloudflare Pages, with Cloudflare Pages Functions as the only backend.

## Two-Repo Architecture

| Repo | Role |
|---|---|
| `ai-mastery` (this repo) | Application code. Auto-deploys to Cloudflare Pages on push. Static frontend + Pages Functions in `functions/api/`. |
| `ai-mastery-data` (private) | JSON data store, accessed via the GitHub Contents API. Holds all user data under `users/<userId>/`. Every write is a git commit, so full progress history comes free. |

The static frontend never talks to GitHub or the Anthropic API directly. All secrets (GitHub PAT, Anthropic key, auth secrets) live server-side in Cloudflare Pages, and all data and AI operations go through Pages Functions.

See `docs/architecture.md` for the full architecture, data layout, and API surface.

## Local Development

```bash
npm install
npm run dev          # Vite dev server (frontend only)
npm run build        # TypeScript check + production build
npm run pages:dev    # Serve the built app with Pages Functions locally (wrangler)
npm run typecheck    # TypeScript only
npm run lint         # ESLint
```

For `pages:dev`, run `npm run build` first (it serves `dist/`) and provide local values for the environment secrets listed below (e.g. via `.dev.vars`, which is gitignored).

> **Note**: `wrangler` is declared as an *optional* dependency because its runtime (`workerd`) ships no Windows ARM64 binary — on that platform `npm install` skips it and `pages:dev` is unavailable locally. Deploys are unaffected: Cloudflare Pages builds and runs Functions in its own CI.

## Environment Secrets

Set in the Cloudflare Pages dashboard (or `wrangler secret put` / `.dev.vars` locally):

- `GITHUB_DATA_PAT` — fine-grained PAT scoped to the `ai-mastery-data` repo only (Contents: Read & write, Metadata: Read)
- `ANTHROPIC_API_KEY` — Anthropic API key
- `APP_PASSPHRASE` — shared passphrase for the auth gate
- `AUTH_SIGNING_SECRET` — cookie signing secret
- `DEFAULT_USER_ID` — set as a plain var in `wrangler.toml` (currently `bas`)

## Status

Phase 1 scaffold. Dashboard and Train pages are placeholders; API endpoints, data seeding, and the visual system land in subsequent tasks. Roadmap and feature designs live in `docs/prd-dev.md`.
