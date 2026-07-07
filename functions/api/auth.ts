// functions/api/auth.ts
// POST /api/auth — passphrase gate.
// Valid passphrase → signed am_auth cookie (Set-Cookie) + { ok: true }.

import { createAuthCookie } from '../_shared/auth'
import type { Env as AuthEnv } from '../_shared/auth'
import { jsonResponse } from '../_shared/types'
import type { PagesFunction } from '../_shared/types'

type Env = AuthEnv

interface AuthRequestBody {
  passphrase: string
}

function isAuthRequestBody(value: unknown): value is AuthRequestBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).passphrase === 'string'
  )
}

/**
 * Constant-time string comparison via crypto.subtle.
 * Hashes both inputs to fixed-length digests, then compares every byte
 * (no early exit), so timing reveals nothing about the secret.
 */
async function secureCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ])

  const bytesA = new Uint8Array(digestA)
  const bytesB = new Uint8Array(digestB)
  let diff = 0
  for (let i = 0; i < bytesA.length; i++) {
    diff |= bytesA[i] ^ bytesB[i]
  }
  return diff === 0
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400)
  }

  if (!isAuthRequestBody(body)) {
    return jsonResponse({ ok: false, error: 'Missing "passphrase" field' }, 400)
  }

  const valid = await secureCompare(body.passphrase, env.APP_PASSPHRASE)
  if (!valid) {
    return jsonResponse({ ok: false, error: 'Invalid passphrase' }, 401)
  }

  const cookie = await createAuthCookie(env)
  return jsonResponse({ ok: true }, 200, { 'Set-Cookie': cookie })
}
