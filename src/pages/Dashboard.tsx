import { DidYouKnow } from '../components/DidYouKnow'
import { DomainCard } from '../components/DomainCard'
import { RadarChart } from '../components/RadarChart'
import { useApp } from '../contexts/AppContext'
import type { AppState } from '../types'

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

      {/* Zone 2: Did You Know */}
      <DidYouKnow />

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
