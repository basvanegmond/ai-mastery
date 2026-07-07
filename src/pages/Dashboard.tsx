import { useEffect, useState } from 'react'
import { DomainCard } from '../components/DomainCard'
import { RadarChart } from '../components/RadarChart'
import { useApp } from '../contexts/AppContext'
import type { AppState } from '../types'
import { TIPS } from '../utils/domains'

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

interface StatTileProps {
  label: string
  value: string
}

function StatTile({ label, value }: StatTileProps): JSX.Element {
  return (
    <div className="flex-1 px-5 py-4">
      <div className="font-serif text-[28px] leading-none text-trypan">{value}</div>
      <div className="mt-1 text-[11px] text-ink-sub">{label}</div>
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
    }, 7000)
    return () => clearInterval(id)
  }, [])

  const tip = TIPS[index]!
  const prev = () => setIndex((i) => (i - 1 + TIPS.length) % TIPS.length)
  const next = () => setIndex((i) => (i + 1) % TIPS.length)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-edge bg-canvas px-4 py-3">
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest text-ink-sub">
        Did you know
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <code className="shrink-0 rounded bg-trypan-light px-1.5 py-0.5 font-mono text-[11px] font-medium text-trypan">
          {tip.badge}
        </code>
        <p className="truncate text-[13px] text-ink">{tip.text}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous tip"
          className="rounded p-1 text-ink-sub hover:bg-canvas-sub"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[10px] tabular-nums text-ink-sub">
          {index + 1}/{TIPS.length}
        </span>
        <button
          type="button"
          onClick={next}
          aria-label="Next tip"
          className="rounded p-1 text-ink-sub hover:bg-canvas-sub"
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
// Domain activity count helper
// ---------------------------------------------------------------------------

function activityThisWeek(state: AppState, domainId: string): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  return state.recentActivity.filter(
    (a) => a.domainId === domainId && Date.parse(a.timestamp) > cutoff,
  ).length
}

// ---------------------------------------------------------------------------
// Radar legend
// ---------------------------------------------------------------------------

function RadarLegend(): JSX.Element {
  return (
    <div className="flex justify-center gap-5 text-[10px] text-ink-sub mt-3">
      <span className="flex items-center gap-1.5">
        <svg width="16" height="3" viewBox="0 0 16 3" aria-hidden="true">
          <line x1="0" y1="1.5" x2="16" y2="1.5" stroke="#1C05B3" strokeWidth="2" />
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
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton(): JSX.Element {
  return (
    <div className="p-6 space-y-6" aria-label="Loading dashboard">
      <div className="flex gap-px overflow-hidden rounded-xl border border-edge bg-edge">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 flex-1 animate-pulse bg-canvas" />
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-xl bg-canvas" />
      <div className="grid grid-cols-3 gap-5">
        <div className="h-64 animate-pulse rounded-xl bg-canvas" />
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-canvas" />
          ))}
        </div>
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
    <div className="space-y-5 p-6">
      {/* Zone 1: Stats row */}
      <section aria-label="Stats">
        <div className="flex overflow-hidden rounded-xl border border-edge bg-canvas divide-x divide-edge">
          <StatTile
            label="Exercises done"
            value={String(state.stats.exercisesDone)}
          />
          <StatTile
            label="Sessions this week"
            value={String(state.stats.sessionsThisWeek)}
          />
          <StatTile
            label="Domains improved"
            value={String(state.stats.domainsImproved)}
          />
          <StatTile
            label="Avg rating"
            value={state.stats.averageRating > 0 ? state.stats.averageRating.toFixed(1) : '—'}
          />
        </div>
      </section>

      {/* Zone 2: Tips strip */}
      <TipsStrip />

      {/* Zone 3: Radar + domain grid */}
      <section aria-label="Skill overview" className="grid grid-cols-3 gap-5">
        {/* Radar */}
        <div className="rounded-xl border border-edge bg-canvas p-4">
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-ink-sub mb-2">
            Skill Radar
          </h2>
          <RadarChart domains={gradedDomains} radarScores={state.radarScores} />
          <RadarLegend />
        </div>

        {/* Domain cards */}
        <div className="col-span-2">
          {gradedDomains.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-edge bg-canvas p-6">
              <p className="text-sm text-ink-sub">
                No graded domains yet. Complete a baseline assessment to see your scores.
              </p>
            </div>
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
      </section>
    </div>
  )
}
