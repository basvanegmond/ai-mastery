// functions/_shared/auth.ts
// Cookie-based passphrase authentication.
// One shared passphrase; HMAC-SHA256-signed cookie valid for 30 days.

export interface Env {
  APP_PASSPHRASE: string
  AUTH_SIGNING_SECRET: string
}

const COOKIE_NAME = 'am_auth'
const COOKIE_MAX_AGE_SECONDS = 2592000 // 30 days
const COOKIE_MAX_AGE_MS = COOKIE_MAX_AGE_SECONDS * 1000

async function importSigningKey(env: Env, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.AUTH_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
}

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return null
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function getCookieValue(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie')
  if (!header) return null

  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq).trim() === name) {
      return part.slice(eq + 1).trim()
    }
  }
  return null
}

/**
 * Verify the request carries a valid, unexpired auth cookie.
 * Cookie value format: `<timestamp>.<hmac_hex>` where the HMAC-SHA256
 * signature covers the timestamp string.
 */
export async function isAuthenticated(request: Request, env: Env): Promise<boolean> {
  const cookie = getCookieValue(request, COOKIE_NAME)
  if (!cookie) return false

  const dot = cookie.indexOf('.')
  if (dot === -1) return false

  const timestampPart = cookie.slice(0, dot)
  const signaturePart = cookie.slice(dot + 1)

  const timestamp = Number(timestampPart)
  if (!Number.isInteger(timestamp) || timestamp <= 0) return false

  // Expired or implausibly far in the future (clock skew tolerance: 1 minute).
  const now = Date.now()
  if (now - timestamp > COOKIE_MAX_AGE_MS) return false
  if (timestamp - now > 60_000) return false

  const signatureBytes = fromHex(signaturePart)
  if (!signatureBytes) return false

  const key = await importSigningKey(env, 'verify')
  // crypto.subtle.verify performs a constant-time comparison.
  return crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    new TextEncoder().encode(timestampPart),
  )
}

/**
 * Create a signed auth cookie string for a Set-Cookie header
 * (used by the POST /api/auth response after passphrase validation).
 */
export async function createAuthCookie(env: Env): Promise<string> {
  const timestamp = String(Date.now())
  const key = await importSigningKey(env, 'sign')
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(timestamp),
  )

  const value = `${timestamp}.${toHex(signature)}`
  return `${COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}`
}

/**
 * Standard 401 response for unauthenticated requests.
 */
export function unauthorizedResponse(): Response {
  return new Response('Unauthorized', { status: 401 })
}
