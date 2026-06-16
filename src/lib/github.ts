import type { MasteryData } from '../types'
import { DEFAULT_MASTERY_DATA } from '../store/defaults'

const REPO = 'basvanegmond/ai-mastery'
const FILE_PATH = 'data/progress.json'
const BRANCH = 'main'

function apiUrl() {
  return `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`
}

export interface GitHubSyncResult {
  data: MasteryData
  sha: string
}

export async function readProgress(token: string): Promise<GitHubSyncResult> {
  const res = await fetch(apiUrl(), {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (res.status === 404) {
    return { data: DEFAULT_MASTERY_DATA, sha: '' }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`GitHub read failed: ${res.status} ${(err as { message?: string }).message ?? ''}`)
  }

  const json = await res.json()
  const raw = atob(json.content.replace(/\n/g, ''))
  const data = JSON.parse(raw) as MasteryData
  return { data, sha: json.sha }
}

export async function writeProgress(
  token: string,
  data: MasteryData,
  sha: string
): Promise<string> {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
  const body: Record<string, unknown> = {
    message: `sync: ${new Date().toISOString()}`,
    content,
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(apiUrl(), {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { message?: string }).message ?? ''
    if (res.status === 409) {
      throw new Error('CONFLICT')
    }
    throw new Error(`GitHub write failed: ${res.status} ${msg}`)
  }

  const json = await res.json()
  return json.content.sha as string
}
