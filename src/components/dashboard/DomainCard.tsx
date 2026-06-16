import type { DomainDefinition, DomainProgress } from '../../types'

interface DomainCardProps {
  domain: DomainDefinition
  progress: DomainProgress
  weeklyExercises: number
}

const MAX = 5

function gradeLabel(score: number): string {
  if (score >= 4.3) return 'A+'
  if (score >= 4.0) return 'A'
  if (score >= 3.0) return 'B'
  if (score >= 2.0) return 'C'
  return 'D'
}

export function DomainCard({ domain, progress, weeklyExercises }: DomainCardProps) {
  const currentPct = (progress.currentLevel / MAX) * 100
  const targetPct = (domain.target / MAX) * 100
  const baselinePct = (domain.baseline / MAX) * 100

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
            {domain.label}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {weeklyExercises > 0 ? `${weeklyExercises} this week` : 'no exercises this week'}
          </div>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div>
            <div className="text-lg font-bold" style={{ color: domain.color, fontFamily: 'DM Mono, monospace' }}>
              {gradeLabel(progress.currentLevel)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {progress.currentLevel.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg2)' }}>
        {/* Baseline marker */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${baselinePct}%`, background: 'var(--border-mid)' }}
        />
        {/* Fill */}
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${currentPct}%`,
            background: `linear-gradient(90deg, ${domain.color}88, ${domain.color})`,
          }}
        />
      </div>

      {/* Scale ticks and target marker */}
      <div className="relative h-5 mt-1">
        {[0, 1, 2, 3, 4, 5].map((tick) => (
          <span
            key={tick}
            className="absolute text-xs"
            style={{
              left: `${(tick / MAX) * 100}%`,
              transform: 'translateX(-50%)',
              color: 'var(--text-muted)',
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
            }}
          >
            {tick}
          </span>
        ))}
        {/* Target marker */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: `${targetPct}%`, transform: 'translateX(-50%)', top: '-16px' }}
        >
          <div className="w-px h-2" style={{ background: 'var(--gold)' }} />
          <span className="text-xs" style={{ color: 'var(--gold)', fontFamily: 'DM Mono, monospace', fontSize: '9px' }}>
            {domain.target}
          </span>
        </div>
      </div>
    </div>
  )
}
