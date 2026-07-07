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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6"
      >
        <h1 className="text-lg font-semibold text-gray-900">AI Mastery</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your passphrase to continue.
        </p>
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
          className="mt-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
        {error !== null && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || passphrase.length === 0}
          className="mt-4 w-full rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
