import { useState } from 'react'
import type { FormEvent } from 'react'

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps): JSX.Element {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (submitting || passphrase.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      })
      if (response.ok) {
        onSuccess()
        return
      }
      let message = 'Login failed'
      try {
        const data: unknown = await response.json()
        if (
          typeof data === 'object' &&
          data !== null &&
          typeof (data as Record<string, unknown>).error === 'string'
        ) {
          message = (data as Record<string, unknown>).error as string
        }
      } catch {
        // keep the default message
      }
      setError(message)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-sub px-4">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-sm rounded-xl border border-edge bg-canvas p-8"
      >
        <h1 className="font-serif text-2xl text-ink">AI Mastery</h1>
        <p className="mt-1 text-sm text-ink-sub">Enter your passphrase to continue.</p>

        <label htmlFor="passphrase" className="sr-only">
          Passphrase
        </label>
        <input
          id="passphrase"
          type="password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="Passphrase"
          autoFocus
          className="mt-5 w-full rounded-lg border border-edge bg-canvas-sub px-3 py-2.5 text-sm text-ink placeholder:text-ink-sub focus:border-trypan focus:outline-none focus:ring-2 focus:ring-trypan/20"
        />
        {error !== null && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || passphrase.length === 0}
          className="mt-4 w-full rounded-lg bg-trypan px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
