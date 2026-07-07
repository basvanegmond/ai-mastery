AI Mastery Platform — Rebuild PRD & Roadmap
Context
AI Mastery is a personal competency-development tool: a coaching system to move Bas from ~85th to 99th-percentile AI tool usage through practice and honest feedback, not content consumption. It currently exists only as a single-file Claude.ai Artifact (ai-mastery-app.jsx) with no separate source repo — ai-mastery-prd.md in this folder is the authored PRD for it, and it is genuinely good: specific, opinionated, with explicit non-goals. The rest of this project folder (CLAUDE.md, README.md, docs/architecture.md, .claude/agents, pipeline/) is unfilled Claude Code project boilerplate, not app code — this is a green-field build, not a migration.

The existing PRD already names its own biggest gap ("baseline scores are hypotheses, not measurements") and lists a baseline-assessment tab and a weekly coaching review as its two highest-priority unbuilt features. This rebuild does four things at once: (1) ships those two already-planned features, (2) moves the whole app off the Artifact sandbox (window.storage and client-side Anthropic calls only work inside claude.ai) onto real, cheap, GitHub-based infrastructure, (3) adds three new capabilities Bas asked for — training on his own 550+-skill Claude Code repository, critiquing uploaded Claude/Claude Code transcripts, and a non-graded "AI Frontier" domain — designed as extensions of the existing evidence model rather than bolted-on silos, and (4) replaces the neomorphic UI with a professional design system via /impeccable.

Preserve, don't relitigate, these existing design principles: not a content tool (no reading lists/articles/course links in the 7 graded domains), not a developer-training tool (exercises stay at "senior professional who directs AI," never require writing/debugging code), not generic (varied realistic business scenarios, never bland placeholders), not a self-congratulation tool (scores move only on genuine evidence, self-rating is a signal not a verdict).

Confirmed architecture decisions (asked directly, do not reopen): Cloudflare Pages (not Vercel — free-tier headroom was the concern), a private GitHub repo as the JSON data store, an Anthropic API key (not Claude-Code-local generation), a pure practice-log design for the new Frontier domain (no curated content/feeds), and a pages.dev URL is acceptable (doesn't need to be github.io).

Architecture
Repos & hosting
ai-mastery (code repo, public or private, Bas's choice) — connected to Cloudflare Pages for auto-deploy on push. Vite + React + TypeScript + Tailwind, static build output, Pages Functions (functions/api/**) for the handful of operations that must not run in the browser.
ai-mastery-data (data repo, must be private) — holds only JSON. Full-mode reflections and transcript uploads will contain real business content, so this cannot be world-readable. A fine-grained GitHub PAT scoped to this repo only (Contents: Read & write, Metadata: Read) lives server-side as a Cloudflare Pages secret. The static frontend never talks to GitHub directly — only Pages Functions do.
Every write is a Git commit, so full progress history comes free (no separate audit-log feature needed — "what did my radar look like 3 months ago" is git log on ai-mastery-data, or filtering evidence by timestamp).
Cheap single-user hedge: every data path is prefixed users/<userId>/, with userId read from a DEFAULT_USER_ID env var, never hardcoded. Auth itself stays a single shared-passphrase cookie gate for v1 — real per-user auth is a later problem, but the data model doesn't need to be rebuilt to get there.
Data store layout (ai-mastery-data)
users/bas/domains.json                                  — domain definitions + baseline history
users/bas/domain-programmes.json                         — personalized per-domain focus plans (new)
users/bas/exercise-log.json                              — Quick + Full mode attempts
users/bas/frontier-log.json                              — AI Frontier practice-log entries (never a grade field)
users/bas/meta.json                                       — streaks, 8-week heatmap, relevance-filter version
users/bas/skills-catalog.json                             — indexed ~/.claude repository (new)
users/bas/coaching-reviews/<date>-<id>.json                — one file per weekly review
users/bas/baseline-assessment/<date>-{initial|retest}.json — one file per assessment, never overwritten
users/bas/sessions/<date>-<id>.json                       — one file per transcript critique (new)
users/bas/sessions/_index.json                            — lightweight list for the history view
Key modeling decision: domains.json never caches a "current" score. It only stores slow-changing definitional data (name, target, description, baseline history). The current radar score per domain is computed at read time by GET /api/state, aggregating every evidence entry across exercise log, coaching reviews, baseline assessments, and transcript sessions — each entry carries a common evidenceWeight tag (quick-correctness, full-self-rated, coaching-review, baseline-assessment, transcript-critique, skills-exercise) so the aggregator can weight sources differently, with coaching-review evidence weighted most heavily (per the existing PRD: this, not self-reported ratings, is meant to be what actually moves the line). This is the most literal implementation possible of "scores move only on genuine evidence" — there's no cached field that can silently drift from the underlying log.

The old diagnostic baseline (3.5 / 2.5 / 1.5 / 2.0 / 2.0 / 1.0 / 3.0 from the existing PRD) is seeded into domains.json's history tagged source: "diagnostic-estimate" for continuity/comparison, but is never used as the authoritative baseline once a real baseline assessment exists — that fixes the existing PRD's own named weakness.

Safe writes without a database: GitHub's Contents API uses sha-based optimistic concurrency (PUT requires the file's current sha; a mismatch 409s). For the few shared/growing files (exercise-log.json, domains.json), Functions do get→mutate→put and retry 2-3× on 409 before surfacing a "please retry" error — genuinely sufficient at single-user, low-concurrency volume. Everything else (coaching reviews, baseline assessments, transcript sessions) writes to a uniquely-named new file (<date>-<id>.json), so there's no race at all.

API surface (Cloudflare Pages Functions, all under functions/api/, all behind the auth cookie except /api/auth)
Endpoint	Purpose
POST /api/auth	Passphrase gate → signed cookie
GET /api/state	Dashboard bulk read + the computed-radar aggregation described above
POST /api/exercises/quick/{generate,submit}	Quick-mode generation and logging (correctness now captured and factored into the radar — fixes the existing "Quick exercises don't move the radar" known issue)
POST /api/exercises/full/submit	Full-mode reflection logging
POST /api/baseline/{generate,score}	Baseline assessment: question generation, Claude-graded scoring, writes measured baseline + (new) triggers domain-programme generation
GET/POST /api/domain-programmes	Read/regenerate the personalized per-domain focus plan (new)
POST /api/coaching/turn	One turn of the weekly coaching conversation; persists a review + grade on completion
POST /api/skills/ingest	Merge-write a fresh local scan into the skills catalog, preserving manual overrides and usage stats (new)
POST /api/skills/relevance	Toggle a catalog entry's include/exclude override (new)
POST /api/skills/exercise/generate	Generate a "which skill/agent fits this scenario" exercise from the filtered catalog (new)
POST /api/transcript/analyze	Normalize an uploaded transcript, analyze it, persist both a standalone report and domain evidence (new)
GET /api/transcript/reviews[/:id]	Browse past transcript-review reports (new)
POST /api/frontier/{question,submit}, GET /api/frontier/log	AI Frontier practice-log flow — question generation, logging, no grade ever (new)
Two shared modules everything depends on: functions/_shared/github.ts (the retry-on-409 Contents API helper) and functions/_shared/anthropic.ts (centralized model config + structured-output helper).

Model selection
Two tiers, both as env-var-configured constants in functions/_shared/anthropic.ts — never a scattered literal, never assumed permanent (this is the actual fix for the existing PRD's "API model string has been a recurring source of failures" issue, which was really two separate problems: an unstable model string, and no schema validation on the response):

MODEL_FAST → claude-haiku-4-5-20251001 — Quick exercise generation, Frontier question generation (high frequency, low stakes)
MODEL_SMART → claude-sonnet-5 — baseline scoring, coaching review, transcript critique, skills-catalog exercises (judgment-heavy, lower frequency)
Fable should re-check these are still the current recommended IDs against live Anthropic docs at build time rather than trusting this document indefinitely. Use structured outputs (JSON-schema-constrained responses) on every generative endpoint instead of the original app's "validate then fall back to a hardcoded library" pattern. Expect low single-digit dollars/month at this usage volume — verify exact current pricing at console.anthropic.com when setting up billing rather than trusting any number here.

Feature designs
1. Baseline assessment + personalized domain programme
Formalizes the existing PRD's own top-priority gap. Timed, 10 questions per graded domain (multiple-choice + scenario judgement), Claude-scored against defined criteria, writes a measured baseline that replaces the diagnostic guess. Retakable later as a "re-test" (new file, history preserved, never overwritten).

New, to properly satisfy "develop a custom programme for each domain to elevate my skills to the 1% mark": immediately after scoring, generate a short per-domain focus plan — 3-5 targeted themes/leverage points derived from which specific questions were missed and by how much, not just the numeric grade. Store in domain-programmes.json, surface on each domain's detail view as "your focus plan," and pass as extra context into Quick/Full/Skills exercise-generation prompts so generated exercises skew toward Bas's actual gaps instead of generic domain-level practice. Regenerate on retest or after a meaningful batch of new evidence, not on every single exercise.

Keep the assessment flow itself tight (7 graded domains only, the 8th is ungraded). Offer skills-catalog setup and a first transcript upload as optional next steps on a "what's next" screen after completion, not folded into the questionnaire.

2. Weekly coaching review
A structured conversational flow: Bas brings evidence, Claude asks 3-4 pointed questions, grades the domain from the answers, persists to coaching-reviews/<date>-<id>.json. This is the evidence source weighted most heavily in the radar aggregation — verify this concretely (see Verification section) rather than assuming the weighting "feels" right.

3. Skills-repository training
Bas's ~/.claude/ is a real, heterogeneous personal repository: ~550-600 skills and ~175 agents across ~10-12 plugin sources (superpowers' 13 meta workflow-discipline skills; Anthropic's knowledge-work-plugins, ~140 skills across business verticals; VoltAgent's awesome-claude-code-subagents, ~140 agents incl. a 9-agent meta-orchestration category; Anthropic's claude-plugins-official; gstack's ~20 design/QA/deploy skills; ~65 gsd-* skills and 31 paul:* commands — two independently-built, near-duplicate implementations of the same phase-workflow pattern, a genuine, illustrative redundancy worth surfacing rather than silently fixing; plus singletons like vercel tooling and ui-ux-pro-max). Bas has already done one manual dedup pass and exported dozens of skills to NotebookLM — there's real prior appetite here, not a cold start.

The deployed app cannot see Bas's filesystem, so:

scripts/scan-skills.ts lives in the code repo and runs locally via Claude Code whenever Bas installs something new or does another cleanup pass. It walks skills/, commands/ (including namespaced dirs like paul/), agents/, and plugins/ (marketplace-installed, with .claude-plugin/plugin.json/marketplace.json as the authoritative source-attribution where present), handles the real mess on disk (double-nested extracted zips, a .skill file that's literally a zip archive — catalog by filename only in v1, don't unzip), and skips _archive/ entirely. Category is inferred from a maintained lookup table in the script (keyed on plugin/marketplace name), never read from a nonexistent category frontmatter field, with an explicit "other" fallback surfaced for manual tagging rather than silently miscategorized.
The script POSTs its output to POST /api/skills/ingest, which merges rather than overwrites — incoming entries carry over userOverride and usageStats from the existing catalog entry with the same id, so re-scanning never wipes manual include/exclude choices.
Default relevance filter (concrete, not just the principle): include superpowers' meta-workflow skills, the meta-orchestration agents, design/frontend skills (gstack, ui-ux-pro-max), both gsd-* and paul:* (deliberately both — see below), core dev-workflow (code-review, git-workflow-manager). Exclude bio-research, department-specific verticals Bas doesn't operate in (finance/legal/HR/customer-support specifics), and the ~140 hands-on language/framework specialist agents (typescript-pro, rust-engineer, etc.) — this last exclusion is the single biggest guardrail against this feature drifting into "developer training tool," which is an explicit non-goal. Manual override always available and durable.
Exercises: "which installed skill/agent fits this scenario," "what would you invoke here and why" — tagged as evidence into Agentic Architecture, Multi-Agent Orchestration, and Tool Selection (currently Bas's weakest domains), evidenceWeight: "skills-exercise".
Cross-reference with transcript critique (below) to surface high-value skills Bas has but rarely invokes.
4. Claude / Claude Code transcript critique
Upload-based (paste text, upload a claude.ai conversation export, or a Claude Code session .jsonl from ~/.claude/projects/<slug>/) — not a live connection, since the deployed app has no access to Bas's machine. POST /api/transcript/analyze normalizes all three source shapes into one lightweight excerpt (keep user/assistant text and tool-use names, drop bulky tool-result payloads, truncate very long sessions with a note), then makes one structured-output Claude call producing two things together:

a standalone findings report (strengths, misses, quoted examples, suggested next exercises — constrain the output schema with no URL/link field, so this can't drift into a reading list) saved to sessions/<date>-<id>.json and browsable historically via GET /api/transcript/reviews, and
a domainEvidence[] array using the same domainId + evidenceWeight: "transcript-critique" shape as every other evidence source, feeding directly into /api/state's aggregation — a new input to the same radar, not a second disconnected score.
Concrete example mappings (illustrative, not exhaustive): re-explaining the same project context repeatedly in one session → negative evidence for Prompt Construction. Accepting a first-draft output containing an internal inconsistency without challenging it → negative for Output Evaluation. Having a strongly-fitting installed skill and not using it (cross-referenced against the skills catalog once Phase 4 exists) → negative for Tool Selection. Diagnosing a failed tool call's root cause and directing a specific fix rather than pasting the error back → positive for Failure Diagnosis. Correctly routing/escalating between sub-agents → positive for Multi-Agent Orchestration.

The definable.ai "4 levels of Claude users" framework (Collaborator → System Builder → Agent → Automation Engine) reviewed during research is useful here as rubric-design input for what "good" looks like at each level (e.g. recognizing effective CLAUDE.md usage, real MCP/tool orchestration) — not as a new visible ladder in the UI. Adding another parallel framework on top of the 7-domain radar plus grades plus a skills catalog plus a Frontier log risks diluting an already rich product; fold its substance into the critique rubric instead of giving it its own surface.

5. AI Frontier domain (8th, non-graded)
New entry in domains.json with graded: false, target: null — visually separate from the 7-spoke radar, never contributes a score. Bas logs something he's encountered (a model release, an architecture pattern, a paper) in a couple sentences; Claude generates a scenario/explain-it-back question to test real understanding; the answer is saved with no grade field, ever — a clean, checkable acceptance bar (assert no entry in frontier-log.json ever contains a score). No curated links, feeds, or reading lists anywhere in this domain, confirmed. Bas's own installed sparring-council.skill (an adversarial multi-persona pattern) and the awesome-claude-code-subagents meta-orchestration category are good, personally-relevant raw material for early example content here.

6. Professional UI via /impeccable
Remove the dark-neomorphism visual language (extruded/inset shadows, DM Mono + Syne) entirely — don't carry a surface: raised|inset|flat concept into any new component API. Build Phase 1's components with plain, minimal structure first to prove the data flow works, then invoke /impeccable to design and apply the actual professional visual system across Dashboard and Train. Every subsequent phase's new UI surface (baseline assessment, coaching review conversation, skills catalog browser, transcript upload/report, Frontier log) should be built consistent with that established system — treat /impeccable as a standing reference for the whole build, not a one-time pass, and do a final consistency pass with it once all phases are in.

Roadmap (phased for autonomous execution)
Phase 1 — Foundations. Initialize git on this folder; replace the placeholder CLAUDE.md/README.md/docs/architecture.md with real project docs once this plan is approved (keep ai-mastery-prd.md, update it to match what actually ships); decide fate of the generic .claude/agents + pipeline/ scaffold (harmless to keep, not required). Create the ai-mastery and ai-mastery-data repos; connect ai-mastery to Cloudflare Pages; set secrets (GITHUB_DATA_PAT scoped to ai-mastery-data only, ANTHROPIC_API_KEY, APP_PASSPHRASE, AUTH_SIGNING_SECRET, DEFAULT_USER_ID). Seed domains.json from the existing 7-domain table. Build the Vite+React+TS+Tailwind scaffold, functions/_shared/{github,anthropic,auth}.ts, /api/auth, /api/state, Quick/Full generate+submit endpoints, and the Dashboard + Train pages reproducing 100% of today's Artifact functionality against real storage. Then run /impeccable to establish the real visual system, replacing the plain scaffold styling. Verify: log in, dashboard shows seeded data, completing a Quick exercise makes a real Anthropic call, captures correctness, and produces a real commit on ai-mastery-data (checkable via git log); state persists across a refresh and a different device.

Phase 2 — Baseline assessment + domain programmes. Depends on Phase 1. /api/baseline/{generate,score}, /api/domain-programmes, the assessment UI, the post-completion "what's next" screen. Verify: completing it replaces placeholder scores with measured ones and produces a focus plan per domain; retaking it adds history without deleting the first result.

Phase 3 — Weekly coaching review. Depends on Phase 1 only. /api/coaching/turn, the conversational UI, and the aggregation weighting that makes this evidence source dominant. Verify concretely: log a Full-mode reflection with a high self-rating for a domain, note the current score; run a coaching review grading that same domain low; confirm the score visibly moves down, proving coaching evidence outweighs self-report.

Phase 4 — Skills-repository training. Depends on Phase 1 only. scripts/scan-skills.ts, /api/skills/{ingest,relevance,exercise/generate}, the catalog browser UI. Verify: a real scan produces roughly the expected volume (~550-600 skills, ~175 agents); toggling an override survives a re-scan; sample 10 generated exercises and confirm none require programming-language-specific reasoning (the concrete guardrail against "developer training tool" drift).

Phase 5 — Transcript critique. Depends on Phase 1; softly benefits from Phase 4 for the skills cross-reference (degrades gracefully without it). Upload UI, normalization, /api/transcript/analyze, history view. Verify: a real uploaded session produces specific quoted findings (not generic filler) and at least one domain-evidence entry that visibly nudges a score; confirm zero links/reading-list content in the output.

Phase 6 — AI Frontier domain. Depends on Phase 1 only; deliberately the smallest phase. 8th domain entry, /api/frontier/*, log UI. Verify: logging produces a question, submitting saves with no grade field, ever; domain never appears on the radar.

Phase 7 — Streaks, nudges, polish. Depends on Phase 1, sequenced last since streak data is most meaningful once real multi-source activity exists. 8-week heatmap, "last active X days" banner, final /impeccable consistency pass across every screen added since Phase 1. Push notifications: lowest-confidence item in the roadmap (service worker, VAPID keys, permission UX) — ship the banner first, treat push as optional/likely-skip for a single user checking in a few times a week.

Guardrails (recheck at each phase)
Skills training must never default toward hands-on language/framework specialist agents (~140 of them exist in the raw inventory) — that's the concrete path back to "developer training tool."
Transcript critique's "suggested next exercises" must stay schema-constrained (no URL field) — insurance against "content tool" drift, don't rely on prompting alone.
AI Frontier domain: assert programmatically that no log entry ever gets a grade/score field.
The GSD/PAUL redundancy is deliberately catalogued in full, not deduplicated — that's the teaching moment, not noise to clean up.
Single-user auth is intentionally minimal; the users/<userId>/ path prefix makes a second user cheap at the data layer later, but the passphrase gate itself is not multi-tenant — don't let that become an invisible assumption baked in elsewhere.
Sources reviewed
ai-mastery-prd.md (this folder) — the full existing PRD, primary source for everything preserved above.
~/.claude/ inventory (skills, agents, commands, plugins, subagent-catalog tool) — explored directly to ground the skills-training feature in reality rather than assumption.
The 4 Levels of Claude Users — reviewed, folded in as rubric-design input for transcript critique (see Feature 4), not as a new UI element.
"The 7 Levels of Using Claude Context Explained" (YouTube) — could not be retrieved programmatically (no transcript access); flagged for Bas or Fable to review manually when writing actual Prompt Construction / context-engineering exercise content.
Skool "AI Automation Society" classroom and the linked Google Sheet (a quarterly video-library index) — reviewed; intentionally not integrated as a feature, consistent with the confirmed pure-practice-log decision and the existing "not a content tool" principle. Bas can keep using it as his own external input for what he logs into the Frontier domain.
Verification (end to end, once Phase 1 ships)
Fresh browser session → passphrase gate → dashboard loads real (seeded) data from /api/state.
Complete one Quick exercise per domain → confirm a real Anthropic API call happened (not the old MOBILE_EX fallback) and a commit landed on ai-mastery-data.
Complete one Full reflection → same check.
Open the app on a second device/browser → identical state, proving it's no longer tied to a claude.ai artifact.
From Phase 2 onward, re-run the specific per-phase verification steps listed above before moving to the next phase — each phase's "done" bar is concrete and checkable, not a vibe.