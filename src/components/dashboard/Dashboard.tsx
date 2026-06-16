import { useState } from 'react'
import { useMasteryStore } from '../../store/masteryStore'
import { DOMAINS } from '../../lib/domains'
import { RadarChart } from './RadarChart'
import { DomainCard } from './DomainCard'

const TIPS = [
  { cmd: '/compact', text: 'Compress context and continue longer Claude Code sessions without losing progress.' },
  { cmd: 'Shift+Enter', text: 'Add a newline in Claude web chat without sending the message.' },
  { cmd: '@filename', text: 'Reference a specific file in Claude Code without copy/pasting its contents.' },
  { cmd: 'CLAUDE.md', text: 'Add a CLAUDE.md to your project root — instructions there apply automatically to every session.' },
  { cmd: 'claude --continue', text: 'Resume the most recent Claude Code session from the terminal without losing context.' },
  { cmd: '/clear', text: 'Reset conversation context in Claude Code while keeping your session open.' },
  { cmd: 'Projects', text: 'Use the Projects tab in Claude web for ongoing work — context persists across conversations.' },
  { cmd: '#memory', text: 'Type # mid-conversation in Claude Code to give a quick memory hint without breaking flow.' },
  { cmd: 'Extended thinking', text: 'Add "think step by step before answering" to unlock deeper reasoning on hard problems.' },
  { cmd: 'Drag & drop', text: 'Drag files or images directly into the Claude web chat instead of copying content.' },
  { cmd: '/init', text: 'Run /init in Claude Code to auto-generate a CLAUDE.md based on your codebase structure.' },
  { cmd: 'Tool use', text: 'Claude can call tools in parallel — structure requests to ask for multiple independent things at once.' },
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
            style={{ background: 'var(--surface)', boxShadow: 'var(--neo-raised)' }}
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
        style={{ background: 'var(--surface)', boxShadow: 'var(--neo-raised)' }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            did you know
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded mr-2"
            style={{ background: 'var(--gold-dim)', color: 'var(--gold)', fontFamily: 'DM Mono, monospace' }}
          >
            {tip.cmd}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>
            {tip.text}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setTipIndex((tipIndex - 1 + TIPS.length) % TIPS.length)}
            className="px-2 py-1 rounded-lg text-xs transition-neo"
            style={{ boxShadow: 'var(--neo-raised)', background: 'var(--surface)', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}
          >
            ←
          </button>
          <button
            onClick={() => setTipIndex((tipIndex + 1) % TIPS.length)}
            className="px-2 py-1 rounded-lg text-xs transition-neo"
            style={{ boxShadow: 'var(--neo-raised)', background: 'var(--surface)', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}
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
          style={{ background: 'var(--surface)', boxShadow: 'var(--neo-raised)' }}
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
                  style={{ background: 'var(--surface)', boxShadow: 'var(--neo-raised)' }}
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
