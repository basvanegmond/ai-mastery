const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeRequest {
  model: string
  max_tokens: number
  system?: string
  messages: ClaudeMessage[]
}

export async function callClaude(req: ClaudeRequest): Promise<string> {
  if (!WORKER_URL) {
    throw new Error('Claude proxy URL not configured. Add VITE_WORKER_URL to your environment.')
  }

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json() as {
    content: { type: string; text: string }[]
    error?: { message: string }
  }

  if (data.error) throw new Error(data.error.message)

  const textBlock = data.content?.find((b) => b.type === 'text')
  if (!textBlock) throw new Error('No text content in response')

  return textBlock.text
}
