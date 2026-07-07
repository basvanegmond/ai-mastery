// functions/_shared/github.ts
// GitHub Contents API helper for the ai-mastery-data repo.
// Read/write JSON files with retry-on-409 for shared mutable files.

export interface GitHubFile {
  content: string // decoded string content
  sha: string
}

export interface Env {
  GITHUB_DATA_PAT: string
  GITHUB_DATA_REPO: string // "owner/repo"
  DEFAULT_USER_ID: string
}

const MAX_RETRIES = 3
const BASE_RETRY_DELAY_MS = 100

function apiUrl(env: Env, path: string): string {
  return `https://api.github.com/repos/${env.GITHUB_DATA_REPO}/contents/${path}`
}

function apiHeaders(env: Env): Record<string, string> {
  return {
    Authorization: `token ${env.GITHUB_DATA_PAT}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ai-mastery-pages-functions',
    'Content-Type': 'application/json',
  }
}

// GitHub returns base64 with embedded newlines; atob rejects those.
// Decode via binary string -> Uint8Array -> TextDecoder to handle UTF-8 correctly.
function decodeBase64(b64: string): string {
  const binary = atob(b64.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

// Encode UTF-8 text to base64 for GitHub API writes.
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface ContentsResponse {
  content: string
  sha: string
}

function isContentsResponse(value: unknown): value is ContentsResponse {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.content === 'string' && typeof record.sha === 'string'
}

/**
 * Read a file from the ai-mastery-data repo.
 * Returns null if the file doesn't exist (404).
 */
export async function readFile(env: Env, path: string): Promise<GitHubFile | null> {
  const response = await fetch(apiUrl(env, path), {
    method: 'GET',
    headers: apiHeaders(env),
  })

  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GitHub read failed for "${path}": ${response.status} ${body}`)
  }

  const data: unknown = await response.json()
  if (!isContentsResponse(data)) {
    throw new Error(`GitHub read for "${path}" returned an unexpected response shape`)
  }

  return {
    content: decodeBase64(data.content),
    sha: data.sha,
  }
}

async function putFile(
  env: Env,
  path: string,
  content: string,
  message: string,
  sha: string | undefined,
): Promise<Response> {
  const body: Record<string, string> = {
    message,
    content: encodeBase64(content),
  }
  if (sha !== undefined) {
    body.sha = sha
  }

  return fetch(apiUrl(env, path), {
    method: 'PUT',
    headers: apiHeaders(env),
    body: JSON.stringify(body),
  })
}

/**
 * Write a file to the ai-mastery-data repo.
 *
 * @param sha - required when updating an existing file; omit when creating a new one
 * @param retries - true (default): retry on 409 conflicts with a fresh sha
 *                  (for shared mutable files like exercise-log.json);
 *                  false: fail fast (for uniquely-named new files)
 */
export async function writeFile(
  env: Env,
  path: string,
  content: string,
  message: string,
  sha?: string,
  retries: boolean = true,
): Promise<void> {
  let currentSha = sha

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await putFile(env, path, content, message, currentSha)

    if (response.ok) {
      return
    }

    if (response.status === 409 && retries && attempt < MAX_RETRIES - 1) {
      // Another write landed between our read and this write.
      // Back off, re-fetch the current sha, and retry.
      await delay(BASE_RETRY_DELAY_MS * 2 ** attempt)
      const latest = await readFile(env, path)
      currentSha = latest?.sha
      continue
    }

    const body = await response.text()
    if (response.status === 409) {
      throw new Error(
        `GitHub write conflict for "${path}" after ${attempt + 1} attempt(s) — please retry. ${body}`,
      )
    }
    throw new Error(`GitHub write failed for "${path}": ${response.status} ${body}`)
  }
}

/**
 * Get the per-user data path for a filename.
 * e.g. userPath(env, "exercise-log.json") → "users/bas/exercise-log.json"
 */
export function userPath(env: Env, filename: string): string {
  return `users/${env.DEFAULT_USER_ID}/${filename}`
}
