const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 500

export async function submitDomainScore(domainId: string, score: number): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch('/api/baseline/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: { [domainId]: score } }),
      })
      if (response.ok) return true
    } catch {
      // network error — fall through to retry
    }
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, attempt * BASE_DELAY_MS))
    }
  }
  return false
}
