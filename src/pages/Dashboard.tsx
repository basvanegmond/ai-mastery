import { Link } from 'react-router-dom'
import { DidYouKnow } from '../components/DidYouKnow'
import { DomainCard } from '../components/DomainCard'
import { RadarChart } from '../components/RadarChart'
import { useApp } from '../contexts/AppContext'
import type { AppState } from '../types'

// ---------------------------------------------------------------------------
// Assessment banner
// ---------------------------------------------------------------------------

function AssessmentBanner({ state }: { state: AppState }): JSX.Element {
  const hasRealBaseline = state.domains.some((d) =>
    d.baselineHistory.some((b) => b.source === 'baseline-assessment'),
  )

  return (
    <Link
      to="/intake"
      className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-trypan/20 bg-trypan-light px-4 py-4 transition-colors hover:border-trypan/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
    >
      <div>
        <p className="text-[13px] font-semibold text-ink">
          {hasRealBaseline
            ? 'Retake your baseline assessment'
            : 'Your scores are still estimates'}
        </p>
        <p className="mt-0.5 text-[12px] text-ink-sub">
          {hasRealBaseline
            ? 'Check how much your scores have moved since your last measured baseline.'
            : 'Take the 15-minute assessment to replace the diagnostic guess with a real measurement.'}
        </p>
      </div>
      <span className="shrink-0 rounded-lg bg-trypan px-4 py-2 text-[12px] font-medium text-white">
        {hasRealBaseline ? 'Retake →' : 'Start →'}
      </span>
    </Link>
  )
}

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
    <div className="space-y-6 px-4 py-6 md:space-y-8 md:px-8 md:py-8" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-4 border-b border-edge pb-6 md:grid-cols-4 md:gap-8 md:pb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-10 w-16 animate-pulse rounded bg-edge" />
            <div className="h-3 w-24 animate-pulse rounded bg-edge" />
          </div>
        ))}
      </div>
      <div className="h-12 animate-pulse rounded bg-edge" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2">
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
    <div className="px-4 py-6 md:px-8 md:py-8">

      {/* Zone 1: Stats — open, no container */}
      <section
        aria-label="Stats"
        className="grid grid-cols-2 gap-4 border-b border-edge pb-6 md:grid-cols-4 md:gap-8 md:pb-8"
      >
        <StatTile label="Exercises done" value={String(state.stats.exercisesDone)} />
        <StatTile label="Sessions this week" value={String(state.stats.sessionsThisWeek)} />
        <StatTile label="Domains improved" value={String(state.stats.domainsImproved)} />
        <StatTile
          label="Avg rating"
          value={state.stats.averageRating > 0 ? state.stats.averageRating.toFixed(1) : '—'}
        />
      </section>

      {/* Zone 1.5: Assessment CTA */}
      <AssessmentBanner state={state} />

      {/* Zone 2: Did You Know */}
      <DidYouKnow />

      {/* Zone 3: Domains LEFT, Radar RIGHT (stacks on mobile) */}
      <section aria-label="Skill overview" className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">

        {/* Domain cards — col-span-2 on LEFT */}
        <div className="md:col-span-2">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-ink-sub">
            Domains
          </p>
          {gradedDomains.length === 0 ? (
            <p className="text-sm text-ink-sub">
              No graded domains yet. Complete a baseline assessment to see your scores.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
