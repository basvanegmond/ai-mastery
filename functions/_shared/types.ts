// functions/_shared/types.ts
// Minimal local stand-in for the Cloudflare Pages Functions handler type
// (we don't have @cloudflare/workers-types installed), plus a small JSON
// response helper shared by the API endpoints.

export type PagesFunction<E = Record<string, unknown>> = (ctx: {
  request: Request
  env: E
  params: Record<string, string>
}) => Promise<Response>

/**
 * Build a JSON Response with the correct Content-Type header.
 */
export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  })
}
