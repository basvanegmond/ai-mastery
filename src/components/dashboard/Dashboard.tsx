import { useState } from 'react'
import { useMasteryStore } from '../../store/masteryStore'
import { DOMAINS } from '../../lib/domains'
import { RadarChart } from './RadarChart'
import { DomainCard } from './DomainCard'

const TIPS = [
  { cmd: '/btw', text: 'Ask a quick side question mid-task without interrupting the main conversation flow.' },
  { cmd: '/rewind', text: 'Restore code AND conversation to a previous point — the undo button for entire sessions.' },
  { cmd: '/goal', text: 'Set a goal and Claude keeps working autonomously until the condition is met.' },
  { cmd: '/focus', text: 'Toggle focus view: hides tool noise, shows only your prompt + final response. Great for reading.' },
  { cmd: '/diff', text: 'View uncommitted changes and per-turn diffs without leaving the Claude Code session.' },
  { cmd: '/context', text: 'Visualize context usage as a colored grid — know when to /compact before hitting limits.' },
  { cmd: '/compact', text: 'Summarize context and keep working. Use it before context gets full, not after.' },
  { cmd: '/checkpoint', text: 'Save working state (git, decisions, remaining work) so you can resume exactly where you left off across sessions.' },
  { cmd: '/investigate', text: 'Never debug directly — use /investigate. It runs root-cause analysis before touching any code.' },
  { cmd: '/qa', text: 'Full test-fix-verify loop. Use /qa-only if you just want a bug report without any changes.' },
  { cmd: '/impeccable', text: 'Full UI/UX audit of any frontend interface — hierarchy, spacing, cognitive load, accessibility, motion.' },
  { cmd: '/design-review', text: "Designer's eye visual QA: finds AI slop patterns, spacing issues, hierarchy problems, then fixes them." },
  { cmd: '/cso', text: 'Chief Security Officer audit — secrets, supply chain, OWASP, STRIDE. Run daily or monthly.' },
  { cmd: '/health', text: 'Code quality dashboard: type-check + lint + tests → composite 0-10 score with trend tracking.' },
  { cmd: '/ship', text: 'Full ship workflow: merge base, run tests, review diff, bump VERSION, update CHANGELOG, create PR.' },
  { cmd: '/autoplan', text: 'Run CEO + Design + Eng + DX reviews sequentially with auto-decisions. One command, fully reviewed plan.' },
  { cmd: '/office-hours', text: 'YC Office Hours mode — six forcing questions that expose demand reality before you commit to building.' },
  { cmd: '/humanizer', text: 'Remove AI writing patterns from any text. Fixes em dash overuse, rule of three, vague attributions.' },
  { cmd: '/freeze', text: 'Restrict edits to one directory for the session — prevents accidentally fixing unrelated code while debugging.' },
  { cmd: '/retro', text: 'Weekly engineering retrospective from commit history. Team-aware, trend-tracked, per-person breakdown.' },
  { cmd: '/loop', text: 'Run any command on a recurring interval — e.g. /loop 30m /health for automatic quality monitoring.' },
  { cmd: '/gsd-progress', text: 'Smart GSD status with routing — tells you ONE next action instead of showing everything at once.' },
  { cmd: '/gsd-capture', text: 'Capture ideas, tasks, and notes mid-session without derailing the current work thread.' },
  { cmd: 'CLAUDE.md', text: 'Project-level instructions in CLAUDE.md apply to every session automatically. Use /init to generate one.' },
]

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function startOfWeek(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function Dashboard() {
  const store = useMasteryStore()
  const [tipIndex, setTipIndex] = useState(0)
  const daysSinceLast = daysSince(store.lastActiveAt)
  const weekStart = startOfWeek()

  const weekExercises = store.exerciseHistory.filter(
    (e) => new Date(e.createdAt) >= weekStart
  )
  const totalExercises = store.exerciseHistory.length
  const avgRating = store.exerciseHistory.length > 0
    ? store.exerciseHistory
        .filter((e) => e.starRating != null)
        .reduce((sum, e) => sum + (e.starRating ?? 0), 0) /
      Math.max(1, store.exerciseHistory.filter((e) => e.starRating != null).length)
    : 0

  const domainsImproved = DOMAINS.filter(
    (d) => store.domainProgress[d.key]?.currentLevel > d.baseline
  ).length

  const weeklyByDomain = Object.fromEntries(
    DOMAINS.map((d) => [
      d.key,
      weekExercises.filter((e) => e.domain === d.key).length,
    ])
  )

  const tip = TIPS[tipIndex]

  return (
    <div className="space-y-6">
      {/* Inactivity banner */}
      {daysSinceLast >= 3 && (
        <div
          className="rounded-xl px-4 py-3 text-sm flex items-center gap-3"
          style={{
            background: 'var(--gold-dim)',
            border: '1px solid var(--gold)',
            color: 'var(--gold)',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          <span>⚠</span>
          <span>
            {daysSinceLast === 1 ? '1 day' : `${daysSinceLast} days`} since last session. Time to train.
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total exercises', value: String(totalExercises), sub: `${weekExercises.length} this week` },
          { label: 'Avg self-rating', value: avgRating > 0 ? `${avgRating.toFixed(1)}★` : '—', sub: 'from reflections' },
          { label: 'This week', value: String(weekExercises.length), sub: 'sessions' },
          { label: 'Domains improved', value: `${domainsImproved}/7`, sub: 'vs baseline' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: 'var(--gold)', fontFamily: 'DM Mono, monospace' }}
            >
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-primary)' }}>
              {stat.label}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Did you know */}
      <div
        className="rounded-xl px-5 py-4 flex items-center gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            did you know
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded mr-2"
            style={{ background: 'var(--gold-dim)', color: 'var(--gold)', fontFamily: 'DM Mono, monospace', border: '1px solid var(--gold)' }}
          >
            {tip.cmd}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>
            {tip.text}
          </span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setTipIndex((tipIndex - 1 + TIPS.length) % TIPS.length)}
            className="interactive px-2 py-1 rounded text-xs"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'transparent', fontFamily: 'DM Mono, monospace' }}
          >
            ←
          </button>
          <button
            onClick={() => setTipIndex((tipIndex + 1) % TIPS.length)}
            className="interactive px-2 py-1 rounded text-xs"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'transparent', fontFamily: 'DM Mono, monospace' }}
          >
            →
          </button>
        </div>
      </div>

      {/* Radar + domain cards */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
        {/* Radar */}
        <div
          className="rounded-xl p-6 flex items-center justify-center w-full lg:w-auto lg:shrink-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
        >
          <RadarChart domainProgress={store.domainProgress} size={320} />
        </div>

        {/* Domain progress bars */}
        <div className="flex-1 w-full grid grid-cols-1 xl:grid-cols-2 gap-3">
          {DOMAINS.map((d) => (
            <DomainCard
              key={d.key}
              domain={d}
              progress={store.domainProgress[d.key] ?? { currentLevel: d.baseline, xpTotal: 0 }}
              weeklyExercises={weeklyByDomain[d.key] ?? 0}
            />
          ))}
        </div>
      </div>

      {/* Identified patterns */}
      {store.patternAnalyses.length > 0 && (
        <section>
          <h2 className="text-base mb-3" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-secondary)' }}>
            Pattern analysis
          </h2>
          <div className="space-y-2">
            {store.patternAnalyses[0].findings
              .filter((f) => f.weaknessTags.length > 0)
              .slice(0, 4)
              .map((finding) => (
                <div
                  key={finding.domain}
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                      {DOMAINS.find((d) => d.key === finding.domain)?.label ?? finding.domain}
                    </span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {finding.weaknessTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background: 'var(--gold-dim)',
                            color: 'var(--gold)',
                            fontFamily: 'DM Mono, monospace',
                            border: '1px solid var(--gold)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {finding.summary}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}
