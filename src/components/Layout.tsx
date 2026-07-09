import { NavLink, Outlet } from 'react-router-dom'
import { AppContext } from '../contexts/AppContext'
import { useAppState } from '../hooks/useAppState'

type NavItem =
  | { to: string; label: string; icon: JSX.Element; disabled?: false }
  | { to?: undefined; label: string; icon: JSX.Element; disabled: true }

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".8" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".8" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".8" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".8" />
      </svg>
    ),
  },
  {
    to: '/quick',
    label: 'Quick',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M9 1L3 9h5l-1 6 6-8H8L9 1z" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/full',
    label: 'Full',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Import',
    disabled: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2v8m0 0L5 7m3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    disabled: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Layout(): JSX.Element {
  const { state, loading, error, refetch } = useAppState()

  if (loading && state === null) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-canvas-sub"
        role="status"
        aria-label="Loading"
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-edge border-t-trypan" />
      </div>
    )
  }

  if (state === null && error !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas-sub px-4">
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 rounded border border-edge px-3 py-2 text-sm text-ink-sub hover:bg-canvas"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ state, refetch }}>
      <div className="flex min-h-screen bg-canvas-sub">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 flex w-48 flex-col border-r border-edge bg-canvas">
          {/* Wordmark + sync */}
          <div className="px-4 pt-5 pb-4">
            <span className="text-[13px] font-semibold tracking-tight text-ink">
              AI Mastery
            </span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  error !== null ? 'bg-red-400' : loading ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                aria-hidden="true"
              />
              <span className="text-[10px] text-ink-sub">
                {error !== null ? 'sync error' : loading ? 'syncing' : 'synced'}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav aria-label="Main navigation" className="flex-1 px-2">
            <ul className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                if (item.disabled) {
                  return (
                    <li key={item.label}>
                      <span className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-ink-sub opacity-40">
                        {item.icon}
                        {item.label}
                      </span>
                    </li>
                  )
                }
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        isActive
                          ? 'flex items-center gap-2.5 rounded-md bg-trypan-light px-3 py-2 text-[13px] font-medium text-trypan'
                          : 'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-ink-sub transition-colors hover:bg-canvas-sub hover:text-ink'
                      }
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <div className="ml-48 flex-1">
          {error !== null && (
            <div className="px-6 pt-4">
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            </div>
          )}
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </AppContext.Provider>
  )
}
