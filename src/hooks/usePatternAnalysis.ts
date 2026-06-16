import { useState } from 'react'
import type { PatternAnalysis, DomainKey } from '../types'
import { callClaude } from '../lib/claude'
import { DOMAINS } from '../lib/domains'
import { compressForAnalysis, parseClaudeExport } from '../lib/conversationParser'
import { useMasteryStore } from '../store/masteryStore'

const DOMAIN_LIST = DOMAINS.map((d) => `${d.key}: ${d.label}`).join('\n')

export function usePatternAnalysis() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addPatternAnalysis } = useMasteryStore()

  async function analyseFile(file: File): Promise<PatternAnalysis | null> {
    return runAnalysis(() => file.text().then((t) => JSON.parse(t)), file.name)
  }

  async function analysePaste(text: string): Promise<PatternAnalysis | null> {
    return runAnalysis(() => Promise.resolve(JSON.parse(text)), 'pasted-conversations.json')
  }

  async function runAnalysis(
    getData: () => Promise<unknown>,
    filename: string
  ): Promise<PatternAnalysis | null> {
    setLoading(true)
    setError(null)

    try {
      const raw = await getData()
      const conversations = parseClaudeExport(raw)
      const compressed = compressForAnalysis(conversations)

      const system = `You are an AI mastery coach analysing Claude.ai conversation exports.
Identify recurring mistakes and weakness patterns for each of these 7 AI mastery domains:

${DOMAIN_LIST}

For each domain, provide:
- weakness_tags: short snake_case labels for specific mistake types (e.g. "no_examples", "accepts_first_answer", "vague_scope")
- error_frequency: how many conversations show each tag
- summary: 1-2 sentence diagnosis

Return ONLY valid JSON array (no markdown):
[{"domain": "domain_key", "weaknessTags": ["tag"], "errorFrequency": {"tag": count}, "summary": "..."}]`

      const text = await callClaude({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system,
        messages: [
          {
            role: 'user',
            content: `Analyse these ${conversations.length} conversations:\n\n${compressed}`,
          },
        ],
      })

      const findings = JSON.parse(text.trim()) as {
        domain: DomainKey
        weaknessTags: string[]
        errorFrequency: Record<string, number>
        summary: string
      }[]

      const analysis: PatternAnalysis = {
        id: crypto.randomUUID(),
        importedAt: new Date().toISOString(),
        conversationCount: conversations.length,
        filename,
        findings,
      }

      addPatternAnalysis(analysis)
      return analysis
    } catch (e) {
      setError(String(e))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { analyseFile, analysePaste, loading, error }
}
