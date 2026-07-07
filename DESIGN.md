<!-- SEED — re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: AI Mastery
description: Personal AI competency coaching — deliberate practice for expert practitioners.
---

# Design System: AI Mastery

## 1. Overview

**Creative North Star: "The Evidence Room"**

This is a personal instrument for measuring what matters: competency, earned through real practice, assessed with honest feedback. The design borrows from Linear and Stripe — near-white surfaces, maximum typographic precision, one deep accent that announces meaning rather than decorates. Where those products serve teams and transactions, this one serves a single practitioner in pursuit of mastery. The result is quieter in places, sharper in others.

Trypan Blue (#1C05B3) is the only opinionated color on the surface layer: a deep electric blue-violet that reads as precision and intent, not enthusiasm. It appears on interactive elements, active states, and earned data markers. The seven competency domains each carry a named hue from a calibrated palette so the radar is legible at a glance, but those domain colors are functional data signals, not brand expression.

The serif/sans pairing gives weight to evaluation moments while the sans carries everyday data without ceremony. Motion is purposeful: the radar draws, scores update, transitions breathe. But never decorative. Bas opens this when he wants honest feedback.

**Key Characteristics:**
- Near-white surfaces, barely tinted toward blue (almost imperceptible)
- Trypan Blue accent: rare, deliberate, used on interactive elements only
- Serif display at evaluation moments; clean sans for data and navigation
- Seven named domain hues: calibrated, distinguishable, professional (data only, never chrome)
- Flat at rest; shadows appear as state signals only (hover, focus)
- Responsive motion, 150-250ms ease-out: state changes animate, layouts do not

## 2. Colors: The Evidence Room Palette

A restrained strategy: blue-tinted neutrals carry the surface; one accent carries intent.

### Primary
- **Trypan Blue** (#1C05B3 / oklch(28% 0.25 268)): The sole opinionated color on the chrome layer. Interactive elements (buttons, active tab underlines, focus rings), the "current" polygon in the radar chart, key call-to-action moments. Rare is the point. If it appears more than once per viewport panel, it's too frequent.

### Neutral
- **Surface White** (to be resolved: oklch(98.5% 0.008 270)): Page and card backgrounds. Barely blue-tinted — looks white in isolation, reads as deliberate alongside Trypan Blue.
- **Ink** (to be resolved: oklch(14% 0.01 268)): Primary text. Near-black, blue-leaning. Never pure #000.
- **Secondary Ink** (to be resolved: oklch(44% 0.006 268)): Supporting text, timestamps, metadata, labels below the fold.
- **Border Gray** (to be resolved: oklch(88% 0.004 268)): Dividers, input strokes, table separators. Tinted to harmonize with the surface.
- **Subtle Surface** (to be resolved: oklch(95% 0.006 268)): Hover backgrounds, inactive tabs, secondary panels — one step darker than Surface White.

### Domain Palette (data layer only)
Seven calibrated hues for the radar chart, progress bars, and domain chips. All tuned to similar perceptual weight on a light surface. Hex values to be resolved at implementation.

1. **Prompt Construction** — medium blue (oklch(48% 0.14 228))
2. **Context Engineering** — teal (oklch(47% 0.12 193))
3. **Output Evaluation** — amber (oklch(62% 0.16 83))
4. **Failure Diagnosis** — coral (oklch(54% 0.18 27))
5. **Tool Selection** — forest (oklch(47% 0.13 153))
6. **Agentic Architecture** — plum (oklch(42% 0.16 308))
7. **Multi-Agent Orchestration** — deep indigo (oklch(40% 0.21 273))

**The One Accent Rule.** Trypan Blue appears on chrome and interactive elements. Domain hues appear inside data components. These two layers never mix: a button is never colored with a domain hue; a domain chip is never Trypan Blue.

**The Earned Signal Rule.** Domain color on a score or progress bar communicates that evidence exists. An absence of domain color (gray, dashed, placeholder) communicates that no measurement has been taken. The difference must be visible and immediate.

## 3. Typography

**Display Font:** Serif (recommend DM Serif Display or Libre Baskerville, to be confirmed at implementation)
**Body Font:** Clean geometric sans (recommend Inter or Geist, to be confirmed at implementation)

**Character:** The serif carries authority at assessment moments — when something has been measured, scored, or named. The sans carries the everyday flow of data, navigation, and practice. The contrast between them is the contrast between judgment and activity.

### Hierarchy
- **Display** (serif, 700, ~40-48px, tight line-height ~1.05): Reserved for large evaluative moments: grade reveal letters (D / C / B / A / A+), baseline result headings, and domain names in dedicated assessment views. Appears rarely.
- **Headline** (serif, 600, ~22-26px, line-height ~1.2): Page-level headings, domain names in detail panels, section anchors with judgment weight.
- **Title** (sans, 600, ~16-18px, line-height ~1.3): Section headings, card titles, tab labels, navigation labels.
- **Body** (sans, 400, ~14-15px, line-height ~1.6, max 65ch): Exercise text, reflection prompts, coaching content, any prose longer than two lines.
- **Label** (sans, 500, ~11-12px, letter-spacing ~0.04em, uppercase): Evidence-type tags (QUICK, COACHING, BASELINE), status indicators, timestamps, radar axis labels.

**The Two-Voice Rule.** The serif speaks at evaluation moments (what was measured, what was earned). The sans speaks during practice and navigation (what to do next, how to move through the tool). Never use the serif on navigation elements or data labels; never use a display weight for everyday body text.

## 4. Elevation

Flat at rest. The surface is the statement. Depth is conveyed through tonal layering (Subtle Surface behind interactive regions) rather than shadows, except as state signals.

**Shadow vocabulary (state signals only):**
- **Hover lift**: `0 2px 8px oklch(28% 0.25 268 / 12%)` — on interactive elements that lift on hover (buttons, domain cards). Blue-tinted shadow reads as active, not decorative.
- **Focus ring**: `0 0 0 3px oklch(28% 0.25 268 / 25%)` — keyboard/click focus indicator. Blue-glow ring, consistent system-wide.
- **Input focus**: `0 0 0 2px #1C05B3` — form inputs and text areas on focus state.

**The Flat-By-Default Rule.** If a shadow exists at rest, it is wrong. Shadows appear only as a response to user state (hover, focus). Never apply a resting shadow to add visual interest. Adjust spacing, typographic weight, or color tint instead.

## 5. Components

[Omitted — seed mode. Document components after the first implementation pass with `/impeccable document`.]

## 6. Do's and Don'ts

### Do
- **Do** use Trypan Blue (#1C05B3) only on interactive elements, active states, and earned data markers. Its rarity is load-bearing.
- **Do** use the serif font for grades, baseline results, and domain headings in assessment contexts. The serif signals that this moment was measured.
- **Do** color domain progress bars, radar segments, and domain chips with the named 7-color domain palette — only there.
- **Do** keep all chrome (nav, buttons, tabs, badges) in the blue-tinted neutral palette plus Trypan Blue as the sole accent.
- **Do** animate state changes (hover, focus, score updates, radar polygon draw) at 150-250ms with ease-out-quart or similar exponential curve.
- **Do** show the evidence source type alongside every score: distinguish coaching-review evidence visually from quick-exercise evidence — the former outweighs the latter.
- **Do** use tonal layering (Subtle Surface) to differentiate secondary panels and inactive regions without shadows.

### Don't
- **Don't** use the old neomorphic system: no extruded or inset shadows on surfaces, no `surface: raised | inset | flat` pattern, no DM Mono + Syne pairing. That system is gone completely.
- **Don't** use domain hues on chrome elements (buttons, nav items, badges, headings). Domain colors are data signals, not branding.
- **Don't** use the hero-metric template: big number, small label below, gradient accent behind. Scores live in context, inside the radar or a domain row, never on a standalone showcase card.
- **Don't** add gamification chrome: no XP counters, flame streak icons, trophy badges, or congratulatory animation sequences. Streaks are tracked; they are not celebrated with visual fanfare.
- **Don't** use reading-list or LMS layouts: no thumbnail cards, no module-completion progress rings, no course-grid structures.
- **Don't** use gradient text (`background-clip: text` with a gradient fill). Emphasis belongs to weight and size.
- **Don't** use border-left or border-right stripes greater than 1px as a colored accent on cards, list items, or alerts. Use background tints or full borders instead.
- **Don't** use pure #000 or #fff anywhere. Every neutral is tinted toward blue (chroma 0.005-0.01).
