# Product Requirements Document
## AI Mastery — Personal Competency Development Tool

**Owner:** Bas van Egmond  
**Status:** Active development  
**Last updated:** May 2026  
**Artefact file:** `ai-mastery-app.jsx` (single canonical file, do not rename)

---

## 1. Product statement

The AI Mastery app is a personal coaching tool built to move one specific user from the 85th to the 99th percentile of AI tool usage, not by consuming content, but by doing real practice and getting honest feedback. It tracks seven competency domains derived from a diagnostic analysis of actual usage patterns, generates fresh exercises via the Anthropic API, and surfaces evidence-based progress rather than self-reported confidence.

The goal is not broad AI literacy. It is operational mastery at the intersection of strategic business judgement and advanced AI tool fluency, targeted at a senior professional who wants to challenge developers and lead business users, not become one of them.

---

## 2. Context

### Why this exists

Most "become a top AI user" content is built around consumption: articles, tutorials, prompt libraries. None of it closes the gap between knowing what a multi-agent architecture is and being able to diagnose when one has failed. The gap is practice, reflection, and honest scoring.

This app was designed bottom-up from a real diagnostic. Twenty-plus conversations were analysed to identify where the user consistently succeeds, approximates, and hits walls. The competency domains are not generic; they reflect actual observed behaviour patterns.

### Who it is for

Primarily one user. The design accommodates others, particularly colleagues who might go through a similar programme, but the content and baselines are calibrated to a specific profile: MBA-level business executive, active AI builder without developer intent, strong strategic background, working across Nutreco and independent venture work.

---

## 3. Design choices

### Neomorphic UI

The app uses dark neomorphism as its visual language. The design principle: depth signals interactivity. Raised surfaces (extruded shadows) are elements you can tap or press. Inset surfaces (recessed shadows) are inputs, status bars, and interactive receivers. Flat surfaces are static content — text, context descriptions, chart containers. This distinction is deliberate and should be maintained in all future additions.

Dark mode is the default. Light mode is available via toggle and uses the classic light neomorphism palette (soft grey base, dual directional shadows). Both modes use DM Mono for UI text and numbers, Syne for headings.

### Responsive layout

Three breakpoints:

- Mobile (< 640px): single column, bottom tab bar, maxWidth 520px
- Tablet (640–1024px): side nav replaces bottom tabs, wider container at 860px
- Desktop (≥ 1024px): 1200px container, radar and progress side-by-side, 4-column stat row, 2-column exercise grid

The side nav on tablet and desktop contains the dark/light toggle and backup button, keeping the main content area clean.

### Score scale

Competency scores run from 1 to 5 using a letter-grade map: D=1, C=2, B=3, A=4, A+=4.3. Progress bars show a 0-5 scale with a gold target marker, so every domain is visually comparable regardless of different targets. The radar chart uses five concentric rings anchored at the correct grade positions: D, C, B, A (highlighted as dashed green), and MAX.

### Generated questions, not static ones

Quick mode exercises are generated fresh via the Anthropic API each time a domain is opened. This prevents repetition, removes Verdara/Nutreco specificity from routine practice, and keeps the questions calibrated to a senior professional level. Each domain has two micro-prompts that define the exercise type, focus area, and exact JSON schema the model must return. The app validates the response before displaying it and falls back to the hardcoded MOBILE_EX library if generation fails.

### Storage

`window.storage` is Claude's built-in persistent key-value API. The app writes to `mastery-logs` on every completion and reads it on mount. A storage probe runs at startup; a small dot (green/red) next to the user's name confirms whether storage is active. A backup panel allows manual JSON export and import as a fallback. The artefact file must never be renamed; renaming breaks storage continuity because each filename gets its own namespace.

---

## 4. What's built

### Dashboard tab

**Header row:** date, "AI Mastery" title, storage status dot, dark/light toggle (mobile) or side nav (tablet/desktop).

**Stats (4 cards):** exercises done with total attempts, average self-rating, sessions this week, domains improved vs baseline.

**Competency radar:** custom SVG, no library dependency. Seven domains. Three polygon lines: baseline (dashed grey), target (dashed green), current (gold). Five concentric rings anchored at D/C/B/A/MAX. The current line moves when users log grade estimates in the Full exercise log.

**Domain progress bars:** 0-5 scale, colour-coded fill per domain, gold vertical marker showing the target score with label above. Scale ticks at bottom (0 through 5).

**Recurring patterns:** five patterns derived from the original diagnostic. Each shows title, frequency label (recurring / structural / occasional) colour-coded in red/yellow/grey, and a 1-2 sentence evidence-based description. Labelled as judgement-based, not measured data.

**Leading indicators:** exercises this week, domains touched, high-rating percentage, each with target and status dot. **Lagging indicators:** domains with grade movement, total attempts, weakest domain.

### Train tab

**Mode toggle:** ⚡ Quick and ◎ Full, inset neomorphic selector at the top.

**Domain pills:** horizontal scroll, one per domain, inset shadow when active.

**Domain description:** flat text below pills, no container, no shadow.

**Quick mode (AI-generated):**
- Loading skeleton while API generates
- Two fresh exercises per domain on each session
- Three exercise types: choice (tap one option, reveal shows why each is right/wrong), sort (tap category buttons to assign items, reveal scores per item), rank (tap options in sequence, reveal shows position accuracy)
- Post-reveal explanation for sort and rank exercises (1-2 sentences on the underlying principle)
- "new ↺" button to regenerate
- Error state shows the actual API error message and falls back to MOBILE_EX hardcoded exercises

**Full mode (reflection-based):**
- 28 exercises across 7 domains, difficulty-labelled Easy/Medium/Hard
- Each exercise requires real work outside the app (Claude Code, document writing, model comparison) and returns here to log
- Reflection textarea, 1-5 star self-rating, optional grade estimate (D through A+)
- Logged entries appear in recent activity and feed the radar current score

**Backup panel (dashboard header):**
- Reads storage probe result and displays a warning if storage is unavailable
- Export: serialises current log to JSON for copying
- Import: paste previously saved JSON to restore progress

---

## 5. What it should do (requirements not yet built)

### Baseline assessment tab (priority: high)

A timed assessment, 10 questions per domain, no looking things up, scored by Claude against defined criteria. This is the single most important missing feature. Current baselines are diagnostic guesses from conversation analysis. The assessment would replace them with measured starting points.

Format: multiple choice and short scenario judgement. Timed per question. Claude scores the answers and writes the grades directly to the radar. Should be retakable as a "re-test" after completing exercises, to show movement over time.

### Weekly coaching review (priority: high)

A structured 5-10 minute conversation with Claude in a new tab or modal. Bas brings evidence (a spec he wrote, a diagnosis he made, an exercise he completed), Claude asks three or four pointed questions, and grades the domain based on the answers. This is how the current line on the radar should actually move, not from self-reported grade estimates in the log form.

### Streak and momentum tracking (priority: medium)

Days active, longest streak, sessions per week over time. Currently the app shows "this week" but has no memory of prior weeks. A simple 8-week activity heatmap (like GitHub contributions) would make the low-usage problem immediately visible.

### Notification or reminder capability (priority: medium)

The user identified low engagement as a problem. The app has no way to prompt return visits. A "last active X days ago" banner on open would at minimum surface the gap. A push notification would be better but depends on the hosting context.

### Richer progress tracking for Quick exercises (priority: medium)

Quick exercises currently log only "completed" status (mobile: true, rating: 3). The score from the exercise (how many correct in a sort, whether a choice was right) is not written to storage and does not influence the radar. This means completing 20 Quick exercises has no effect on the competency scores. The score should be written and factored into the domain grade.

---

## 6. What it should not do

**Not a content tool.** No reading lists, no articles, no course links. The moment this becomes a consumption surface it competes with things that do that better.

**Not a developer training tool.** Exercises must stay at the level of a senior business professional who works with AI tools, not one who builds them. Nothing requiring Claude Code, terminal access, or code review is appropriate for the Quick mode. Full mode can push harder but should stay in the "spec and direct" zone rather than "write and debug."

**Not generic.** The questions should always be grounded in realistic business contexts. Generic placeholder scenarios ("a company wants to improve its process") produce generic learning. The micro-prompts deliberately vary industry context but maintain professional seniority throughout.

**Not a self-congratulation tool.** The app should not make it easy to feel good about low engagement. Scores should only move when there is genuine evidence. Self-rating alone should be treated as a signal, not a verdict.

**Not dependent on a specific conversation context.** The Quick exercises are generated to work without any knowledge of Verdara, Nutreco, or Bas's specific projects. Full exercises reference those contexts because they require real work, but Quick exercises should be usable by any senior professional in any sector.

---

## 7. Known issues

**API generation reliability.** The model string has been a recurring source of failures (`claude-haiku-4-5-20251001` is currently set). If generation silently fails, the error message now surfaces in the UI, but the fallback to MOBILE_EX means the user sees stale content rather than an obvious failure state. The error should be more visible.

**Radar current line does not move from Quick exercises.** Completing a Quick exercise writes a minimal log entry with a fixed rating of 3 and no grade. This means the current polygon on the radar does not reflect Quick exercise performance at all.

**Storage continuity depends on filename.** `window.storage` namespaces by artefact identifier, which includes the filename. Any future renaming of `ai-mastery-app.jsx` will create a fresh storage namespace and lose all logged progress. The backup panel is the only recovery path if this happens accidentally.

**Light mode neomorphism contrast.** The light theme has lower contrast than dark, particularly on mobile in bright environments. The stat cards and progress bars are readable but the neomorphic shadow depth is less pronounced than in dark mode.

**Baseline scores are hypotheses, not measurements.** All seven starting scores are derived from a qualitative diagnostic, not a structured assessment. Until the baseline assessment tab is built, the radar reflects informed opinion, not measured capability.

---

## 8. Architecture summary

**Single file:** `ai-mastery-app.jsx`. All data, components, logic, and rendering in one file. No build step, no dependencies beyond React hooks and standard browser APIs.

**External dependencies:**
- Anthropic API (`/v1/messages`) for Quick exercise generation
- Google Fonts (DM Mono, Syne) loaded via @import in the style block

**Storage:** `window.storage` (Claude's built-in artefact persistence). Key: `mastery-logs`. Value: JSON object keyed by exercise ID, each value an array of attempt entries.

**State management:** local React useState throughout. No external state library. A `genStatusRef` pattern (mutable object in useState to avoid stale closures) tracks API generation status outside the render cycle.

**Theming:** two theme objects (DARK, LIGHT) passed as `t` prop to every component. All colours, shadows, and neomorphic values come from `t`.

**Responsive:** `useBreakpoint` hook reads `window.innerWidth` and returns `isMobile`, `isTablet`, `isDesktop`. Layout constants (maxWidth, padding, grid columns, radar size) are derived from these.

---

## 9. Competency domains reference

| Domain | Baseline | Target | Description |
|---|---|---|---|
| Prompt Construction | 3.5 | 4.0 | Front-load clarity, scope intent precisely, eliminate iterative correction loops |
| Output Evaluation | 2.5 | 4.0 | Challenge AI outputs, surface assumptions, pressure-test logic |
| Agentic Architecture | 1.5 | 4.0 | Design agent systems: orchestrators, sub-agents, tool calls, failure modes |
| Tool Selection | 2.0 | 3.8 | Deliberate mental model for when each tool wins and why |
| Failure Diagnosis | 2.0 | 3.5 | Narrate what went wrong without outsourcing the thinking |
| Multi-Agent Orchestration | 1.0 | 3.5 | State management, routing logic, session persistence, escalation handling |
| Business Value Translation | 3.0 | 4.3 | Move from capability to a board-ready value thesis |

Baselines are diagnostic estimates from conversation history analysis, not measured scores. All scores use the 1-5 scale where D=1, C=2, B=3, A=4, A+=4.3.
