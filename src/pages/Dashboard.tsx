import { useEffect, useState } from 'react'
import { DomainCard } from '../components/DomainCard'
import { RadarChart } from '../components/RadarChart'
import { useApp } from '../contexts/AppContext'
import type { AppState } from '../types'
import { TIPS } from '../utils/domains'

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

function StatTile({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <div className="font-display text-[38px] font-semibold leading-none tracking-tight text-trypan">
        {value}
      </div>
      <div className="mt-2 text-[12px] text-ink-sub">{label}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tips strip
// ---------------------------------------------------------------------------

function TipsStrip(): JSX.Element {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % TIPS.length)
    }, 12000)
    return () => clearInterval(id)
  }, [])

  const tip = TIPS[index]!
  const prev = () => setIndex((i) => (i - 1 + TIPS.length) % TIPS.length)
  const next = () => setIndex((i) => (i + 1) % TIPS.length)

  return (
    <div className="flex items-start gap-5 border-b border-edge py-5">
      <span className="mt-0.5 shrink-0 text-[10px] font-medium uppercase tracking-widest text-ink-sub">
        Did you know
      </span>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <code className="mt-0.5 shrink-0 rounded bg-trypan-light px-1.5 py-0.5 font-mono text-[11px] font-medium text-trypan">
          {tip.badge}
        </code>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink">{tip.text}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-sub">{tip.why}</p>
        </div>
      </div>
      <div className="mt-0.5 flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous tip"
          className="rounded p-1 text-ink-sub hover:text-ink"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[10px] tabular-nums text-ink-sub">{index + 1}/{TIPS.length}</span>
        <button
          type="button"
          onClick={next}
          aria-label="Next tip"
          className="rounded p-1 text-ink-sub hover:text-ink"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Radar legend
// ---------------------------------------------------------------------------

function RadarLegend(): JSX.Element {
  return (
    <div className="mt-4 flex justify-center gap-5 text-[10px] text-ink-sub">
      <span className="flex items-center gap-1.5">
        <svg width="16" height="3" viewBox="0 0 16 3" aria-hidden="true">
          <line x1="0" y1="1.5" x2="16" y2="1.5" stroke="#2563EB" strokeWidth="2" />
        </svg>
        Current
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="16" height="3" viewBox="0 0 16 3" aria-hidden="true">
          <line x1="0" y1="1.5" x2="16" y2="1.5" stroke="#7C87E8" strokeWidth="1.5" strokeDasharray="4 2" />
        </svg>
        Target
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="16" height="3" viewBox="0 0 16 3" aria-hidden="true">
          <line x1="0" y1="1.5" x2="16" y2="1.5" stroke="#9B9BB0" strokeWidth="1.5" strokeDasharray="4 2" />
        </svg>
        Baseline
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Activity count helper
// ---------------------------------------------------------------------------

function activityThisWeek(state: AppState, domainId: string): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  return state.recentActivity.filter(
    (a) => a.domainId === domainId && Date.parse(a.timestamp) > cutoff,
  ).length
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton(): JSX.Element {
  return (
    <div className="px-8 py-8 space-y-8" aria-label="Loading dashboard">
      <div className="grid grid-cols-4 gap-8 border-b border-edge pb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-10 w-16 animate-pulse rounded bg-edge" />
            <div className="h-3 w-24 animate-pulse rounded bg-edge" />
          </div>
        ))}
      </div>
      <div className="h-12 animate-pulse rounded bg-edge" />
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-edge" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-edge" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Dashboard(): JSX.Element {
  const { state } = useApp()

  if (state === null) return <Skeleton />

  const gradedDomains = state.domains.filter((d) => d.graded)

  return (
    <div className="px-8 py-8">

      {/* Zone 1: Stats — open, no container */}
      <section aria-label="Stats" className="grid grid-cols-4 gap-8 border-b border-edge pb-8">
        <StatTile label="Exercises done" value={String(state.stats.exercisesDone)} />
        <StatTile label="Sessions this week" value={String(state.stats.sessionsThisWeek)} />
        <StatTile label="Domains improved" value={String(state.stats.domainsImproved)} />
        <StatTile
          label="Avg rating"
          value={state.stats.averageRating > 0 ? state.stats.averageRating.toFixed(1) : '—'}
        />
      </section>

      {/* Zone 2: Tips strip */}
      <TipsStrip />

      {/* Zone 3: Domains LEFT, Radar RIGHT */}
      <section aria-label="Skill overview" className="mt-8 grid grid-cols-3 gap-10">

        {/* Domain cards — col-span-2 on LEFT */}
        <div className="col-span-2">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-ink-sub">
            Domains
          </p>
          {gradedDomains.length === 0 ? (
            <p className="text-sm text-ink-sub">
              No graded domains yet. Complete a baseline assessment to see your scores.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {gradedDomains.map((domain) => (
                <DomainCard
                  key={domain.id}
                  domain={domain}
                  currentScore={state.radarScores[domain.id] ?? 0}
                  activityThisWeek={activityThisWeek(state, domain.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Radar — col-span-1 on RIGHT, no container */}
        <div>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-ink-sub">
            Skill Radar
          </p>
          <RadarChart domains={gradedDomains} radarScores={state.radarScores} />
          <RadarLegend />
        </div>

      </section>
    </div>
  )
}
