import { DomainProgressBar } from '../components/DomainProgressBar'
import { RadarChart } from '../components/RadarChart'
import { useApp } from '../contexts/AppContext'
import type { ActivityEntry, Domain } from '../types'

function formatTimestamp(timestamp: string): string {
  const time = Date.parse(timestamp)
  if (!Number.isFinite(time)) return timestamp
  return new Date(time).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  )
}

function Skeleton(): JSX.Element {
  return (
    <div className="space-y-6 p-4 sm:p-8" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
      <div className="mx-auto h-64 w-64 animate-pulse rounded-full bg-gray-200" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    </div>
  )
}

function ActivityRow({
  entry,
  domains,
}: {
  entry: ActivityEntry
  domains: Domain[]
}): JSX.Element {
  const domainName =
    domains.find((d) => d.id === entry.domainId)?.name ?? entry.domainId
  return (
    <li className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2">
      <div>
        <span className="text-sm font-medium text-gray-900">{domainName}</span>
        <span
          className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
            entry.mode === 'quick'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {entry.mode}
        </span>
      </div>
      <span className="text-xs text-gray-500">{formatTimestamp(entry.timestamp)}</span>
    </li>
  )
}

export default function Dashboard(): JSX.Element {
  const { state } = useApp()

  if (state === null) {
    return <Skeleton />
  }

  const gradedDomains = state.domains.filter((d) => d.graded)
  const recent = state.recentActivity.slice(0, 5)

  return (
    <div className="space-y-8 p-4 sm:p-8">
      {/* Stats row */}
      <section aria-label="Stats">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Exercises Done" value={String(state.stats.exercisesDone)} />
          <StatCard
            label="Sessions This Week"
            value={String(state.stats.sessionsThisWeek)}
          />
          <StatCard
            label="Domains Improved"
            value={String(state.stats.domainsImproved)}
          />
          <StatCard
            label="Avg Rating"
            value={
              state.stats.averageRating > 0
                ? state.stats.averageRating.toFixed(1)
                : '—'
            }
          />
        </div>
      </section>

      {/* Radar chart */}
      <section aria-label="Radar chart">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Skill Radar</h2>
        <RadarChart domains={gradedDomains} radarScores={state.radarScores} />
        <div className="mt-2 flex justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 bg-amber-500" /> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 border-t border-dashed border-emerald-500" />{' '}
            Target
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 border-t border-dashed border-gray-400" />{' '}
            Baseline
          </span>
        </div>
      </section>

      {/* Domain progress bars */}
      <section aria-label="Domain progress">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Domains</h2>
        <div className="space-y-4">
          {gradedDomains.map((domain) => (
            <DomainProgressBar
              key={domain.id}
              domain={domain}
              currentScore={state.radarScores[domain.id] ?? 0}
            />
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section aria-label="Recent activity">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent Activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">
            No activity yet — head to Train to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} domains={state.domains} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
