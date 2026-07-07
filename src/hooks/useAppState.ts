import { useCallback, useEffect, useState } from 'react'
import type { ActivityEntry, AppState, Domain } from '../types'

// ---------------------------------------------------------------------------
// Type guards for the /api/state response
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBaselineEntry(
  value: unknown,
): value is Domain['baselineHistory'][number] {
  return (
    isRecord(value) &&
    typeof value.score === 'number' &&
    typeof value.timestamp === 'string' &&
    typeof value.source === 'string'
  )
}

function isDomain(value: unknown): value is Domain {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    (typeof value.target === 'number' || value.target === null) &&
    typeof value.graded === 'boolean' &&
    Array.isArray(value.baselineHistory) &&
    value.baselineHistory.every(isBaselineEntry)
  )
}

function isActivityEntry(value: unknown): value is ActivityEntry {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.domainId === 'string' &&
    (value.mode === 'quick' || value.mode === 'full') &&
    typeof value.timestamp === 'string' &&
    (value.score === undefined || typeof value.score === 'number')
  )
}

function isStats(value: unknown): value is AppState['stats'] {
  return (
    isRecord(value) &&
    typeof value.exercisesDone === 'number' &&
    typeof value.sessionsThisWeek === 'number' &&
    typeof value.domainsImproved === 'number' &&
    typeof value.averageRating === 'number'
  )
}

function isAppState(value: unknown): value is AppState {
  return (
    isRecord(value) &&
    Array.isArray(value.domains) &&
    value.domains.every(isDomain) &&
    isRecord(value.radarScores) &&
    Object.values(value.radarScores).every((v) => typeof v === 'number') &&
    isStats(value.stats) &&
    Array.isArray(value.recentActivity) &&
    value.recentActivity.every(isActivityEntry) &&
    isRecord(value.meta)
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseAppStateResult {
  state: AppState | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  refetch: () => void
}

/**
 * Fetches /api/state on mount and exposes loading/error/auth flags.
 * refetch() re-runs the fetch (called after login and after submissions);
 * it keeps the previous state visible while the new one loads.
 */
export function useAppState(): UseAppStateResult {
  const [state, setState] = useState<AppState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [fetchCount, setFetchCount] = useState(0)

  const refetch = useCallback(() => {
    setFetchCount((count) => count + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/state')
        if (cancelled) return

        if (response.status === 401) {
          setIsAuthenticated(false)
          setState(null)
          return
        }
        if (!response.ok) {
          throw new Error(`Failed to load state (HTTP ${response.status})`)
        }

        const data: unknown = await response.json()
        if (!isAppState(data)) {
          throw new Error('Server returned state in an unexpected shape')
        }
        if (!cancelled) {
          setIsAuthenticated(true)
          setState(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load state')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [fetchCount])

  return { state, loading, error, isAuthenticated, refetch }
}
