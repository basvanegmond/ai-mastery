import { useState } from 'react'
import type { DomainKey } from '../../types'
import { DOMAINS, DOMAIN_MAP } from '../../lib/domains'
import { QuickExercise } from './QuickExercise'
import { FullExercise } from './FullExercise'
import { useMasteryStore } from '../../store/masteryStore'

type Mode = 'quick' | 'full'

interface TrainingModeProps {
  forcedMode?: Mode
}

export function TrainingMode({ forcedMode }: TrainingModeProps) {
  const [localMode, setLocalMode] = useState<Mode>('quick')
  const [activeDomain, setActiveDomain] = useState<DomainKey>('prompt_construction')
  const store = useMasteryStore()

  const mode = forcedMode ?? localMode
  const domainDef = DOMAIN_MAP[activeDomain]
  const workerConfigured = !!import.meta.env.VITE_WORKER_URL

  return (
    <div className="space-y-5">
      {/* Mode toggle — only when not forced by tab */}
      {!forcedMode && (
        <div
          className="inline-flex rounded-lg p-0.5"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
        >
          {(['quick', 'full'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setLocalMode(m)}
              className="interactive px-4 py-1.5 rounded-md text-sm"
              style={{
                background: mode === m ? 'var(--surface)' : 'transparent',
                color: mode === m ? 'var(--gold)' : 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace',
                border: mode === m ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              {m === 'quick' ? '⚡ Quick' : '◎ Full'}
            </button>
          ))}
        </div>
      )}

      {/* Domain pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DOMAINS.map((d) => {
          const weeklyCount = store.exerciseHistory.filter(
            (e) =>
              e.domain === d.key &&
              new Date(e.createdAt) >= new Date(Date.now() - 7 * 86400000)
          ).length
          const active = activeDomain === d.key

          return (
            <button
              key={d.key}
              onClick={() => setActiveDomain(d.key)}
              className="interactive shrink-0 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: active ? 'var(--active-bg)' : 'var(--surface)',
                color: active ? d.color : 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace',
                border: active ? `1px solid ${d.color}` : '1px solid var(--border)',
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

      {/* Top weakness tags */}
      {(() => {
        const tags = Object.entries(store.weaknessTags[activeDomain] ?? {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
        if (tags.length === 0) return null
        return (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
              focus areas:
            </span>
            {tags.map(([tag, count]) => (
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
                {tag} ×{count}
              </span>
            ))}
          </div>
        )
      })()}

      {/* Worker not configured warning */}
      {mode === 'quick' && !workerConfigured && (
        <div
          className="rounded-lg p-3 text-xs"
          style={{
            background: 'var(--gold-dim)',
            border: '1px solid var(--gold)',
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
