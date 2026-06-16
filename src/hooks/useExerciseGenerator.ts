import { useState, useCallback } from 'react'
import type { DomainKey, GeneratedExercise, ExerciseType } from '../types'
import { callClaude } from '../lib/claude'
import { DOMAIN_MAP } from '../lib/domains'
import { useMasteryStore } from '../store/masteryStore'

const EXERCISE_SCHEMA = `{
  "corePromptText": "string — key scenario phrase used for deduplication",
  "question": "string — the question to present",
  "options": [{"id": "a", "text": "string"}, {"id": "b", "text": "string"}, {"id": "c", "text": "string"}, {"id": "d", "text": "string"}],
  "correctAnswer": "a|b|c|d — for choice. Array of ids in correct order for rank. Object {id: category} for sort.",
  "explanation": "string — 2-3 sentences explaining the correct answer and why alternatives are wrong",
  "weaknessTagsAddressed": ["tag1", "tag2"]
}`

export function useExerciseGenerator() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const store = useMasteryStore()

  const generate = useCallback(
    async (domain: DomainKey, type: ExerciseType): Promise<GeneratedExercise | null> => {
      setLoading(true)
      setError(null)

      try {
        const domainDef = DOMAIN_MAP[domain]
        const weaknessTags = store.weaknessTags[domain] ?? {}
        const topWeaknesses = Object.entries(weaknessTags)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([tag]) => tag)

        const recentHashes = store.exerciseHistory
          .filter((e) => e.domain === domain)
          .slice(0, 20)
          .map((e) => e.promptSnapshot.slice(0, 80))

        const system = `You are an expert AI training coach for senior business professionals.
Generate a single ${type} exercise for the domain: ${domainDef.label}.
Domain description: ${domainDef.description}

${topWeaknesses.length > 0 ? `Focus on these identified weakness areas: ${topWeaknesses.join(', ')}` : ''}
${recentHashes.length > 0 ? `Do NOT create exercises similar to these recent prompts:\n${recentHashes.map((h, i) => `${i + 1}. ${h}`).join('\n')}` : ''}

Exercise requirements:
- Senior business professional level (MBA+, executive context)
- Realistic industry scenarios (vary sectors, avoid Verdara/Nutreco specifics)
- For "choice": 4 options with one clearly correct answer
- Make distractors plausible but subtly wrong for instructive contrast

Return ONLY valid JSON matching this schema (no markdown, no explanation outside JSON):
${EXERCISE_SCHEMA}`

        const text = await callClaude({
          model: 'claude-opus-4-8',
          max_tokens: 1500,
          system,
          messages: [{ role: 'user', content: `Generate a ${type} exercise for ${domainDef.label}.` }],
        })

        const json = JSON.parse(text.trim()) as Omit<GeneratedExercise, 'id' | 'domain' | 'type'>
        const exercise: GeneratedExercise = {
          id: crypto.randomUUID(),
          domain,
          type,
          ...json,
        }
        return exercise
      } catch (e) {
        setError(String(e))
        return null
      } finally {
        setLoading(false)
      }
    },
    [store.exerciseHistory, store.weaknessTags]
  )

  return { generate, loading, error }
}
