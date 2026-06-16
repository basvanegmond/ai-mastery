/**
 * Cloudflare Worker — Claude API proxy
 *
 * Setup:
 * 1. Deploy via Cloudflare dashboard (Workers & Pages → Create Worker → paste this file)
 * 2. Add secret: ANTHROPIC_API_KEY (Worker → Settings → Variables → Secret)
 * 3. Copy the Worker URL (*.workers.dev) into GitHub Actions secret VITE_WORKER_URL
 *
 * The Worker is locked to the GitHub Pages origin to prevent abuse.
 */

const ALLOWED_ORIGIN = 'https://basvanegmond.github.io'

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(ALLOWED_ORIGIN) })
    }

    // Origin check (also permits localhost for dev)
    const allowed = origin === ALLOWED_ORIGIN || origin.startsWith('http://localhost')
    if (!allowed) {
      return new Response('Forbidden', { status: 403 })
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    // Forward to Anthropic API
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await upstream.json()

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(ALLOWED_ORIGIN),
      },
    })
  },
}
