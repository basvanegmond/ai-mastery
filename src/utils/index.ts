// Shared utilities for the AI Mastery frontend.
// Placeholder — real helpers (API client, formatting, aggregation display)
// arrive with the Phase 1 feature work.

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
