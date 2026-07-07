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
  target: number
  graded: boolean
  baselineHistory: Array<{
    score: number
    timestamp: string
    source: string
  }>
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
}
