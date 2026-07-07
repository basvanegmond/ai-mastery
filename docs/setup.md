# AI Mastery — Setup Guide

Complete these steps to go live. The code is ready; you need to wire up the infrastructure.

## Prerequisites

- GitHub account (repos)
- Cloudflare account (Pages)
- Anthropic API key

## Step 1: Create the data repo (ai-mastery-data)

1. Go to github.com/new
2. Name: `ai-mastery-data`
3. **Visibility: Private** (contains real business content)
4. Initialize with a README
5. Click "Create repository"

## Step 2: Seed the data repo

Copy the files from `data/seed/` in this repo into `ai-mastery-data`, preserving the folder structure:

```
ai-mastery-data/
  users/
    bas/
      domains.json      ← copy from data/seed/users/bas/domains.json
      exercise-log.json ← copy from data/seed/users/bas/exercise-log.json
      meta.json         ← copy from data/seed/users/bas/meta.json
```

You can do this via the GitHub web UI (upload files) or clone + commit.

## Step 3: Create a fine-grained GitHub PAT

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Name: `ai-mastery-data-rw`
3. Repository access: **Only select repositories** → `ai-mastery-data`
4. Permissions:
   - Contents: **Read and write**
   - Metadata: **Read-only**
5. Generate and copy the token (you won't see it again)

## Step 4: Connect to Cloudflare Pages

1. Go to dash.cloudflare.com → Workers & Pages → Create application → Pages
2. Connect to Git → Select the `ai-mastery` repo
3. Build settings:
   - Framework preset: None (or Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Click "Save and Deploy" (first deploy will run)

## Step 5: Set environment secrets

In Cloudflare Pages → your project → Settings → Environment variables, add:

| Variable | Value | Type |
|----------|-------|------|
| `GITHUB_DATA_PAT` | (from Step 3) | Secret |
| `GITHUB_DATA_REPO` | `your-github-username/ai-mastery-data` | Variable |
| `ANTHROPIC_API_KEY` | (from console.anthropic.com) | Secret |
| `APP_PASSPHRASE` | (choose a strong passphrase) | Secret |
| `AUTH_SIGNING_SECRET` | (32+ random characters) | Secret |
| `DEFAULT_USER_ID` | `bas` | Variable |

Add these for both "Production" and "Preview" environments.

To generate a secure `AUTH_SIGNING_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 6: Trigger a fresh deploy

After setting all secrets:

1. Cloudflare Pages → Deployments → Retry latest deployment
2. Or push any commit to trigger a new build

## Step 7: Verify

Open your pages.dev URL and run through the Phase 1 verification checklist (see the "Verification" section in [prd-dev.md](prd-dev.md)):

1. Fresh browser session → passphrase gate → dashboard loads real (seeded) data from `/api/state`
2. Complete one Quick exercise per domain → confirm a real Anthropic API call happened and a commit landed on ai-mastery-data
3. Complete one Full reflection → same check
4. Open the app on a second device/browser → identical state, proving it's no longer tied to a claude.ai artifact

## Troubleshooting

**Dashboard shows wrong/empty data**

- Check that `users/bas/domains.json` exists in ai-mastery-data
- Verify `GITHUB_DATA_REPO` is `owner/repo` format (e.g. `basvanegmond/ai-mastery-data`)

**"Unauthorized" after correct passphrase**

- Verify `APP_PASSPHRASE` and `AUTH_SIGNING_SECRET` are set in Cloudflare (not just local)
- Check that both Production and Preview environments have the secrets

**Exercise generation fails**

- Verify `ANTHROPIC_API_KEY` is valid at console.anthropic.com
- Check Cloudflare Pages → Functions → Logs for error details

**GitHub write errors**

- Confirm PAT has Contents: Read & Write permission
- Confirm PAT is scoped to the correct repo

## Local development

```bash
npm run dev          # Frontend only (no Functions)
npm run pages:dev    # Full local stack with Functions (needs wrangler + .dev.vars)
```

For `pages:dev`, create `.dev.vars` (gitignored) with all the secrets from Step 5.
