import type { ParsedConversation } from '../types'

interface RawMessage {
  uuid?: string
  sender: 'human' | 'assistant'
  text: string
  created_at?: string
}

interface RawConversation {
  uuid: string
  name: string
  chat_messages: RawMessage[]
}

export function parseClaudeExport(raw: unknown): ParsedConversation[] {
  if (!Array.isArray(raw)) {
    throw new Error('Expected a JSON array of conversations')
  }

  return raw
    .filter(isRawConversation)
    .map((conv): ParsedConversation => {
      const humanTurns = conv.chat_messages
        .filter((m) => m.sender === 'human')
        .map((m) => m.text)

      const patternFlags = humanTurns.map((text) => ({
        noExamples: !/(for example|e\.g\.|```|\bsuch as\b)/i.test(text),
        vagueConstraints: !/\b(\d+|specific|exactly|must|require|only|limit)\b/i.test(text),
        correctionLoops: /\b(no,?\s+I meant|that'?s not|actually,?\s+I|wait,?\s+(no|let))\b/i.test(text),
        shortComplexAsk: text.length < 60 && /\b(build|create|design|write|analyse|compare)\b/i.test(text),
      }))

      return {
        uuid: conv.uuid,
        name: conv.name ?? 'Untitled',
        humanTurns,
        patternFlags,
      }
    })
}

function isRawConversation(v: unknown): v is RawConversation {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.uuid === 'string' &&
    Array.isArray(o.chat_messages)
  )
}

// Compress conversations for sending to Claude (avoid token bloat)
export function compressForAnalysis(convs: ParsedConversation[]): string {
  return convs
    .slice(0, 60)
    .map((c, i) =>
      `[${i + 1}] "${c.name}"\n` +
      c.humanTurns
        .slice(0, 3)
        .map((t) => `  > ${t.slice(0, 250)}`)
        .join('\n')
    )
    .join('\n\n')
}
