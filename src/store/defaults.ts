import type { MasteryData } from '../types'
import { DOMAINS } from '../lib/domains'

export const DEFAULT_MASTERY_DATA: MasteryData = {
  version: 1,
  lastActiveAt: new Date().toISOString(),
  domainProgress: Object.fromEntries(
    DOMAINS.map((d) => [d.key, { currentLevel: d.baseline, xpTotal: 0 }])
  ) as MasteryData['domainProgress'],
  exerciseHistory: [],
  weaknessTags: Object.fromEntries(DOMAINS.map((d) => [d.key, {}])) as MasteryData['weaknessTags'],
  patternAnalyses: [],
  githubSha: '',
}
