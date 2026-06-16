export type DomainKey =
  | 'prompt_construction'
  | 'output_evaluation'
  | 'agentic_architecture'
  | 'tool_selection'
  | 'failure_diagnosis'
  | 'multi_agent_orchestration'
  | 'business_value_translation'

export type ExerciseType = 'choice' | 'sort' | 'rank' | 'reflection'

export type GradeLabel = 'D' | 'C' | 'B' | 'A' | 'A+'

export interface DomainDefinition {
  key: DomainKey
  label: string
  shortLabel: string
  baseline: number
  target: number
  color: string
  description: string
}

export interface ExerciseOption {
  id: string
  text: string
}

export interface GeneratedExercise {
  id: string
  domain: DomainKey
  type: ExerciseType
  corePromptText: string  // hashed to prevent repeats
  question: string
  options: ExerciseOption[]
  correctAnswer: string | string[]
  explanation: string
  weaknessTagsAddressed: string[]
}

export interface ExerciseEntry {
  id: string
  domain: DomainKey
  type: ExerciseType
  exerciseHash: string
  promptSnapshot: string
  userAnswer: unknown
  correctAnswer: unknown
  score: number  // 0.0–1.0
  starRating?: number  // reflection only
  gradeEstimate?: GradeLabel
  reflection?: string
  weaknessTagsAddressed: string[]
  createdAt: string
}

export interface DomainProgress {
  currentLevel: number
  xpTotal: number
}

export interface WeaknessTags {
  [tag: string]: number  // tag → frequency count
}

export interface ParsedConversation {
  uuid: string
  name: string
  humanTurns: string[]
  patternFlags: {
    noExamples: boolean
    vagueConstraints: boolean
    correctionLoops: boolean
    shortComplexAsk: boolean
  }[]
}

export interface PatternAnalysis {
  id: string
  importedAt: string
  conversationCount: number
  filename: string
  findings: {
    domain: DomainKey
    weaknessTags: string[]
    errorFrequency: Record<string, number>
    summary: string
  }[]
}

export interface MasteryData {
  version: number
  lastActiveAt: string
  domainProgress: Record<DomainKey, DomainProgress>
  exerciseHistory: ExerciseEntry[]
  weaknessTags: Record<DomainKey, WeaknessTags>
  patternAnalyses: PatternAnalysis[]
  githubSha: string  // SHA of data/progress.json in repo; for conflict-safe writes
}
