# AI Mastery

Personal competency development tool: coaching system to move Bas from ~85th to 99th-percentile AI tool usage through practice and honest feedback.

## Tech Stack
- **Framework**: Vite + React 18 + TypeScript (strict)
- **Styling**: Tailwind CSS
- **Backend**: Cloudflare Pages Functions (TypeScript)
- **Data store**: Private GitHub repo (ai-mastery-data) via Contents API
- **AI**: Anthropic API (claude-haiku-4-5-20251001 for fast ops, claude-sonnet-5 for judgment)
- **Hosting**: Cloudflare Pages

## Key Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + Vite build
- `npm run typecheck` — TypeScript only
- `npm run lint` — ESLint
- `npm run pages:dev` — Local Cloudflare Pages dev with Functions

## Project Structure
- `src/pages/` — React page components (Dashboard, Train, etc.)
- `src/components/` — Shared UI components
- `src/types/` — TypeScript types
- `functions/api/` — Cloudflare Pages Functions (server-side only)
- `functions/_shared/` — Shared modules for Functions (github.ts, anthropic.ts, auth.ts)

## Environment Secrets (set in Cloudflare Pages dashboard)
- `GITHUB_DATA_PAT` — Fine-grained PAT scoped to ai-mastery-data repo only
- `ANTHROPIC_API_KEY` — Anthropic API key
- `APP_PASSPHRASE` — Shared passphrase for auth gate
- `AUTH_SIGNING_SECRET` — Cookie signing secret
- `DEFAULT_USER_ID` — Currently "bas"

## Architecture Rules
- The static frontend NEVER calls GitHub directly — only Pages Functions do
- Every write is a git commit on ai-mastery-data (full history comes free)
- All AI generation uses structured outputs (JSON schema constrained)
- Auth: single shared-passphrase cookie gate for v1
