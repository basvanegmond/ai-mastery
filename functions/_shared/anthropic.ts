// functions/_shared/anthropic.ts
// Anthropic API client: model constants, structured-output helper (tool-use
// pattern), and a simple text call.

export interface Env {
  ANTHROPIC_API_KEY: string
}

// Model constants — never scattered as literals
export const MODEL_FAST = 'claude-haiku-4-5-20251001' // Quick exercise gen, Frontier questions
export const MODEL_SMART = 'claude-sonnet-5' // Baseline scoring, coaching, transcripts

const API_URL = 'https://api.anthropic.com/v1/messages'
const API_VERSION = '2023-06-01'
const DEFAULT_MAX_TOKENS = 4096

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TextBlock {
  type: 'text'
  text: string
}

interface ToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: unknown
}

type ContentBlock = TextBlock | ToolUseBlock

interface MessagesResponse {
  content: ContentBlock[]
}

function isContentBlock(value: unknown): value is ContentBlock {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  if (record.type === 'text') return typeof record.text === 'string'
  if (record.type === 'tool_use') return 'input' in record
  return false
}

function isMessagesResponse(value: unknown): value is MessagesResponse {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return Array.isArray(record.content) && record.content.every(isContentBlock)
}

async function callApi(env: Env, body: Record<string, unknown>): Promise<MessagesResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': API_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${errorBody}`)
  }

  const data: unknown = await response.json()
  if (!isMessagesResponse(data)) {
    throw new Error('Anthropic API returned an unexpected response shape')
  }
  return data
}

/**
 * Call Claude with a JSON schema constraint and return the parsed result.
 * Uses the tool-use pattern: defines a single tool whose input_schema is the
 * output schema, forces tool use, and extracts the tool_use block's input.
 */
export async function callStructured<T>(
  env: Env,
  model: string,
  messages: Message[],
  systemPrompt: string,
  outputSchema: Record<string, unknown>, // JSON Schema object
  toolName: string,
): Promise<T> {
  const data = await callApi(env, {
    model,
    max_tokens: DEFAULT_MAX_TOKENS,
    system: systemPrompt,
    messages,
    tools: [
      {
        name: toolName,
        description: 'Return the structured output for this task.',
        input_schema: outputSchema,
      },
    ],
    tool_choice: { type: 'any' },
  })

  const toolUse = data.content.find(
    (block): block is ToolUseBlock => block.type === 'tool_use',
  )
  if (!toolUse) {
    throw new Error(
      `Anthropic response contained no tool_use block for tool "${toolName}"`,
    )
  }

  return toolUse.input as T
}

/**
 * Simple text call (no structured output required).
 * Returns the concatenated text of all text blocks in the response.
 */
export async function callText(
  env: Env,
  model: string,
  messages: Message[],
  systemPrompt: string,
): Promise<string> {
  const data = await callApi(env, {
    model,
    max_tokens: DEFAULT_MAX_TOKENS,
    system: systemPrompt,
    messages,
  })

  const text = data.content
    .filter((block): block is TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')

  if (text.length === 0) {
    throw new Error('Anthropic response contained no text content')
  }
  return text
}
