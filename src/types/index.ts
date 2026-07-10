export type EvidenceWeight =
  | 'quick-correctness'
  | 'full-self-rated'
  | 'coaching-review'
  | 'baseline-assessment'
  | 'transcript-critique'
  | 'skills-exercise'

export interface DomainEvidence {
  domainId: string
  score: number
  evidenceWeight: EvidenceWeight
  timestamp: string
  notes?: string
}

export interface Domain {
  id: string
  name: string
  description: string
  target: number | null
  graded: boolean
  baselineHistory: Array<{
    score: number
    timestamp: string
    source: string
  }>
}

export interface ActivityEntry {
  id: string
  domainId: string
  mode: 'quick' | 'full'
  timestamp: string
  score?: number
}

export interface AppState {
  domains: Domain[]
  radarScores: Record<string, number>
  stats: {
    exercisesDone: number
    sessionsThisWeek: number
    domainsImproved: number
    averageRating: number
  }
  recentActivity: ActivityEntry[]
  meta: Record<string, unknown>
}

export type ExerciseType = 'choice' | 'sort' | 'rank'

export interface ExerciseOption {
  id: string
  text: string
  correct?: boolean
  category?: string
  rank?: number
}

export interface QuickExercise {
  id: string
  type: ExerciseType
  domainId: string
  question: string
  options: ExerciseOption[]
  explanation?: string
}

export type TipLevel = 'beginner' | 'mid' | 'senior' | 'complex'

export type TipTool = 'Claude Chat' | 'Claude Code' | 'Claude Cowork' | 'Claude Design' | 'Other LLMs'

export interface Tip {
  id: string
  badge: string
  short: string
  heading: string
  what: string
  when: string
  why: string
  domain: string
  level: TipLevel
  tags: string[]
  tools: TipTool[]
}
