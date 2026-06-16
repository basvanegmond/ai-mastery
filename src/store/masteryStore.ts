import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  DomainKey,
  ExerciseEntry,
  MasteryData,
  PatternAnalysis,
  WeaknessTags,
} from '../types'
import { DEFAULT_MASTERY_DATA } from './defaults'
import { readProgress, writeProgress } from '../lib/github'

interface MasteryStore extends MasteryData {
  // GitHub sync state
  githubToken: string
  syncStatus: 'idle' | 'syncing' | 'error' | 'conflict'
  syncError: string

  // Actions
  setGithubToken: (token: string) => void
  syncFromGithub: () => Promise<void>
  syncToGithub: () => Promise<void>
  loadFromData: (data: MasteryData) => void

  addExerciseEntry: (entry: ExerciseEntry) => void
  updateWeaknessTags: (domain: DomainKey, tags: WeaknessTags) => void
  addPatternAnalysis: (analysis: PatternAnalysis) => void
  touchLastActive: () => void
}

export const useMasteryStore = create<MasteryStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_MASTERY_DATA,

      githubToken: '',
      syncStatus: 'idle',
      syncError: '',

      setGithubToken(token) {
        set({ githubToken: token })
      },

      async syncFromGithub() {
        const { githubToken } = get()
        if (!githubToken) return
        set({ syncStatus: 'syncing' })
        try {
          const { data, sha } = await readProgress(githubToken)
          set({
            ...data,
            githubSha: sha,
            syncStatus: 'idle',
            syncError: '',
          })
        } catch (e) {
          set({ syncStatus: 'error', syncError: String(e) })
        }
      },

      async syncToGithub() {
        const state = get()
        if (!state.githubToken) return
        set({ syncStatus: 'syncing' })
        try {
          const data: MasteryData = {
            version: state.version,
            lastActiveAt: state.lastActiveAt,
            domainProgress: state.domainProgress,
            exerciseHistory: state.exerciseHistory,
            weaknessTags: state.weaknessTags,
            patternAnalyses: state.patternAnalyses,
            githubSha: state.githubSha,
          }
          const newSha = await writeProgress(state.githubToken, data, state.githubSha)
          set({ githubSha: newSha, syncStatus: 'idle', syncError: '' })
        } catch (e) {
          if (String(e).includes('CONFLICT')) {
            set({ syncStatus: 'conflict', syncError: 'Remote data is newer. Reload to sync.' })
          } else {
            set({ syncStatus: 'error', syncError: String(e) })
          }
        }
      },

      loadFromData(data) {
        set({ ...data })
      },

      addExerciseEntry(entry) {
        const state = get()
        const prev = state.domainProgress[entry.domain]
        const xpGain = Math.round(entry.score * 10)
        const levelDelta = entry.score >= 0.8 ? 0.05 : entry.score < 0.4 ? -0.02 : 0
        const newLevel = Math.max(1, Math.min(5, prev.currentLevel + levelDelta))

        set({
          exerciseHistory: [entry, ...state.exerciseHistory].slice(0, 500),
          domainProgress: {
            ...state.domainProgress,
            [entry.domain]: {
              currentLevel: Math.round(newLevel * 100) / 100,
              xpTotal: prev.xpTotal + xpGain,
            },
          },
          lastActiveAt: new Date().toISOString(),
        })

        get().syncToGithub()
      },

      updateWeaknessTags(domain, tags) {
        set((state) => ({
          weaknessTags: { ...state.weaknessTags, [domain]: tags },
        }))
      },

      addPatternAnalysis(analysis) {
        set((state) => {
          // Merge weakness tags from the analysis into the store
          const updatedTags = { ...state.weaknessTags }
          for (const finding of analysis.findings) {
            const existing = updatedTags[finding.domain] ?? {}
            const merged: WeaknessTags = { ...existing }
            for (const [tag, count] of Object.entries(finding.errorFrequency)) {
              merged[tag] = (merged[tag] ?? 0) + count
            }
            updatedTags[finding.domain] = merged
          }

          return {
            patternAnalyses: [analysis, ...state.patternAnalyses].slice(0, 20),
            weaknessTags: updatedTags,
          }
        })
        get().syncToGithub()
      },

      touchLastActive() {
        set({ lastActiveAt: new Date().toISOString() })
      },
    }),
    {
      name: 'mastery-v1',
      partialize: (state) => ({
        version: state.version,
        lastActiveAt: state.lastActiveAt,
        domainProgress: state.domainProgress,
        exerciseHistory: state.exerciseHistory,
        weaknessTags: state.weaknessTags,
        patternAnalyses: state.patternAnalyses,
        githubSha: state.githubSha,
        githubToken: state.githubToken,
      }),
    }
  )
)
