# Architecture

## Overview

AI Mastery is a single-user coaching app with a deliberately minimal, cheap infrastructure footprint:

- **Frontend**: Vite + React 18 + TypeScript (strict) + Tailwind CSS. Pure static build (`dist/`), no SSR framework.
- **Backend**: Cloudflare Pages Functions in `functions/api/` — the only server-side code.
- **Data store**: A private GitHub repo (`ai-mastery-data`) holding only JSON, accessed via the GitHub Contents API.
- **AI**: Anthropic API for all generation and grading.
- **Hosting**: Cloudflare Pages, auto-deploy on push to this repo.

## Two-Repo Model

| Repo | Visibility | Contents |
|---|---|---|
| `ai-mastery` | code repo | App source. Connected to Cloudflare Pages. |
| `ai-mastery-data` | **must be private** | JSON only. Full-mode reflections and transcript uploads contain real business content, so this cannot be world-readable. |

A fine-grained GitHub PAT scoped to `ai-mastery-data` only (Contents: Read & write, Metadata: Read) lives server-side as a Cloudflare Pages secret (`GITHUB_DATA_PAT`).

**Hard rule: the static frontend never talks to GitHub directly — only Pages Functions do.** The browser also never holds the Anthropic key; all AI calls happen inside Functions.

Every write is a git commit on `ai-mastery-data`, so full progress history comes free — "what did my radar look like 3 months ago" is `git log` on the data repo, no separate audit-log feature needed.

### Single-user hedge

Every data path is prefixed `users/<userId>/`, with `userId` read from the `DEFAULT_USER_ID` env var (currently `bas`), never hardcoded. Auth itself is a single shared-passphrase cookie gate for v1 — the passphrase gate is not multi-tenant, but the data model doesn't need rebuilding to add a second user later.

## Data Store Layout (`ai-mastery-data`)

```
users/bas/domains.json                                     — domain definitions + baseline history
users/bas/domain-programmes.json                           — personalized per-domain focus plans
users/bas/exercise-log.json                                — Quick + Full mode attempts
users/bas/frontier-log.json                                — AI Frontier practice-log entries (never a grade field)
users/bas/meta.json                                        — streaks, 8-week heatmap, relevance-filter version
users/bas/skills-catalog.json                              — indexed ~/.claude repository
users/bas/coaching-reviews/<date>-<id>.json                — one file per weekly review
users/bas/baseline-assessment/<date>-{initial|retest}.json — one file per assessment, never overwritten
users/bas/sessions/<date>-<id>.json                        — one file per transcript critique
users/bas/sessions/_index.json                             — lightweight list for the history view
```

### Key modeling decision: no cached scores

`domains.json` never caches a "current" score. It stores only slow-changing definitional data (name, target, description, baseline history). The current radar score per domain is **computed at read time by `GET /api/state`**, aggregating every evidence entry across the exercise log, coaching reviews, baseline assessments, and transcript sessions.

Each evidence entry carries a common `evidenceWeight` tag:

- `quick-correctness`
- `full-self-rated`
- `coaching-review` — weighted most heavily; this, not self-reported ratings, is what actually moves the line
- `baseline-assessment`
- `transcript-critique`
- `skills-exercise`

This is the most literal implementation of "scores move only on genuine evidence" — there is no cached field that can silently drift from the underlying log.

The old diagnostic baseline (3.5 / 2.5 / 1.5 / 2.0 / 2.0 / 1.0 / 3.0) is seeded into `domains.json` history tagged `source: "diagnostic-estimate"` for continuity, but is never authoritative once a real baseline assessment exists.

## Safe Writes Without a Database

GitHub's Contents API uses **sha-based optimistic concurrency**: a `PUT` requires the file's current `sha`; a mismatch returns 409.

- **Shared/growing files** (`exercise-log.json`, `domains.json`): Functions do get → mutate → put, and retry 2–3× on 409 before surfacing a "please retry" error. Sufficient at single-user, low-concurrency volume.
- **Everything else** (coaching reviews, baseline assessments, transcript sessions): writes go to a uniquely-named new file (`<date>-<id>.json`), so there is no race at all.

The retry helper lives in `functions/_shared/github.ts`.

## API Surface

All Cloudflare Pages Functions live under `functions/api/`. All endpoints sit behind the auth cookie except `POST /api/auth`.

| Endpoint | Purpose |
|---|---|
| `POST /api/auth` | Passphrase gate → signed cookie |
| `GET /api/state` | Dashboard bulk read + computed-radar aggregation |
| `POST /api/exercises/quick/{generate,submit}` | Quick-mode generation and logging (correctness captured and factored into the radar) |
| `POST /api/exercises/full/submit` | Full-mode reflection logging |
| `POST /api/baseline/{generate,score}` | Baseline assessment: question generation, Claude-graded scoring, writes measured baseline + triggers domain-programme generation |
| `GET/POST /api/domain-programmes` | Read/regenerate the personalized per-domain focus plan |
| `POST /api/coaching/turn` | One turn of the weekly coaching conversation; persists a review + grade on completion |
| `POST /api/skills/ingest` | Merge-write a fresh local scan into the skills catalog, preserving manual overrides and usage stats |
| `POST /api/skills/relevance` | Toggle a catalog entry's include/exclude override |
| `POST /api/skills/exercise/generate` | Generate a "which skill/agent fits this scenario" exercise from the filtered catalog |
| `POST /api/transcript/analyze` | Normalize an uploaded transcript, analyze it, persist a standalone report + domain evidence |
| `GET /api/transcript/reviews[/:id]` | Browse past transcript-review reports |
| `POST /api/frontier/{question,submit}`, `GET /api/frontier/log` | AI Frontier practice-log flow — question generation, logging, no grade ever |

Two shared modules everything depends on:

- `functions/_shared/github.ts` — the retry-on-409 Contents API helper
- `functions/_shared/anthropic.ts` — centralized model config + structured-output helper

(`functions/_shared/auth.ts` handles the cookie gate.)

## Model Selection

Two tiers, both env-var-configured constants in `functions/_shared/anthropic.ts` — never a scattered literal, never assumed permanent:

| Constant | Model | Used for |
|---|---|---|
| `MODEL_FAST` | `claude-haiku-4-5-20251001` | Quick exercise generation, Frontier question generation (high frequency, low stakes) |
| `MODEL_SMART` | `claude-sonnet-5` | Baseline scoring, coaching review, transcript critique, skills-catalog exercises (judgment-heavy, lower frequency) |

Re-check these IDs against live Anthropic docs at build time rather than trusting this document indefinitely. Every generative endpoint uses **structured outputs** (JSON-schema-constrained responses) — no "validate then fall back to a hardcoded library" pattern.

## Environment Configuration

| Name | Kind | Purpose |
|---|---|---|
| `DEFAULT_USER_ID` | plain var (`wrangler.toml`) | Data path prefix, currently `bas` |
| `GITHUB_DATA_PAT` | secret | Fine-grained PAT, `ai-mastery-data` only |
| `ANTHROPIC_API_KEY` | secret | Anthropic API |
| `APP_PASSPHRASE` | secret | Auth gate passphrase |
| `AUTH_SIGNING_SECRET` | secret | Cookie signing |

## SPA Routing

`public/_redirects` contains `/* /index.html 200` so Cloudflare Pages serves the SPA for all client-side routes. Requests to `/api/*` are handled by Pages Functions before the static/redirect layer.
