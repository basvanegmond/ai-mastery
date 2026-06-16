import { useState } from 'react'
import type { DomainKey } from '../../types'
import { DOMAINS, DOMAIN_MAP } from '../../lib/domains'
import { QuickExercise } from './QuickExercise'
import { FullExercise } from './FullExercise'
import { useMasteryStore } from '../../store/masteryStore'

type Mode = 'quick' | 'full'

export function TrainingMode() {
  const [mode, setMode] = useState<Mode>('quick')
  const [activeDomain, setActiveDomain] = useState<DomainKey>('prompt_construction')
  const store = useMasteryStore()

  const domainDef = DOMAIN_MAP[activeDomain]
  const workerConfigured = !!import.meta.env.VITE_WORKER_URL

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div
        className="flex rounded-xl p-1"
        style={{ background: 'var(--bg2)', boxShadow: 'var(--neo-inset)' }}
      >
        {(['quick', 'full'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2 rounded-lg text-sm transition-neo"
            style={{
              boxShadow: mode === m ? 'var(--neo-raised)' : 'none',
              background: mode === m ? 'var(--surface)' : 'transparent',
              color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'DM Mono, monospace',
            }}
          >
            {m === 'quick' ? '⚡ Quick' : '◎ Full'}
          </button>
        ))}
      </div>

      {/* Domain pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DOMAINS.map((d) => {
          const weeklyCount = store.exerciseHistory.filter(
            (e) =>
              e.domain === d.key &&
              new Date(e.createdAt) >= new Date(Date.now() - 7 * 86400000)
          ).length

          return (
            <button
              key={d.key}
              onClick={() => setActiveDomain(d.key)}
              className="shrink-0 px-3 py-2 rounded-xl text-xs transition-neo"
              style={{
                boxShadow: activeDomain === d.key ? 'var(--neo-inset)' : 'var(--neo-raised)',
                background: 'var(--surface)',
                color: activeDomain === d.key ? d.color : 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace',
                borderBottom: activeDomain === d.key ? `2px solid ${d.color}` : '2px solid transparent',
              }}
            >
              {d.shortLabel}
              {weeklyCount > 0 && (
                <span className="ml-1 opacity-60">×{weeklyCount}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Domain description */}
      <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
        {domainDef.description}
      </p>

      {/* Top weakness tags for this domain */}
      {(() => {
        const tags = Object.entries(store.weaknessTags[activeDomain] ?? {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        if (tags.length === 0) return null
        return (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
              focus areas:
            </span>
            {tags.map(([tag, count]) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: 'rgba(240,192,64,0.1)',
                  color: 'var(--gold)',
                  fontFamily: 'DM Mono, monospace',
                }}
              >
                {tag} ×{count}
              </span>
            ))}
          </div>
        )
      })()}

      {/* Worker not configured warning */}
      {mode === 'quick' && !workerConfigured && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{
            background: 'rgba(240,192,64,0.1)',
            border: '1px solid rgba(240,192,64,0.3)',
            color: 'var(--gold)',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          ⚠ Claude proxy not configured. Set VITE_WORKER_URL to enable AI-generated exercises.
          Go to Settings to learn how.
        </div>
      )}

      {/* Exercise view */}
      {mode === 'quick'
        ? <QuickExercise key={activeDomain} domain={activeDomain} />
        : <FullExercise key={activeDomain} domain={activeDomain} />}
    </div>
  )
}
