import { NavLink, Outlet } from 'react-router-dom'
import { AppContext } from '../contexts/AppContext'
import { useAppState } from '../hooks/useAppState'
import { LoginForm } from './LoginForm'

const tabs = [
  { to: '/', label: 'Dashboard' },
  { to: '/train', label: 'Train' },
]

export default function Layout(): JSX.Element {
  const { state, loading, error, isAuthenticated, refetch } = useAppState()

  // Full-screen spinner only on the initial load (state stays visible on refetch).
  if (loading && state === null) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
        role="status"
        aria-label="Loading"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-amber-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // A non-401 failure on the initial load is an error, not a logged-out state.
    if (error !== null) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4">
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-3 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return <LoginForm onSuccess={refetch} />
  }

  return (
    <AppContext.Provider value={{ state, refetch }}>
      <div className="min-h-screen bg-white text-gray-900">
        <header className="border-b border-gray-200">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <span className="font-semibold">AI Mastery</span>
            <div className="flex gap-4">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.to === '/'}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-sm font-medium text-gray-900 underline underline-offset-4'
                      : 'text-sm text-gray-500 hover:text-gray-900'
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </header>
        {error !== null && (
          <div className="mx-auto max-w-5xl px-4 pt-4">
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        )}
        <main className="mx-auto max-w-5xl">
          <Outlet />
        </main>
      </div>
    </AppContext.Provider>
  )
}
