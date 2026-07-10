import { NavLink, Outlet } from 'react-router-dom'

interface LayoutProps {
  loading: boolean
  error: string | null
}

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
]

function SyncDot({ loading, error }: { loading: boolean; error: string | null }): JSX.Element {
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
        error !== null ? 'bg-red-400' : loading ? 'bg-amber-400' : 'bg-emerald-400'
      }`}
      aria-hidden="true"
    />
  )
}

export default function Layout({ loading, error }: LayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-canvas-sub">
      {/* Mobile top bar */}
      <div className="flex items-center gap-2.5 border-b border-white/6 bg-sidebar px-4 py-3 md:hidden">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br from-trypan to-[#0053EC] text-[10px] font-extrabold text-white">
          AI
        </div>
        <span className="text-[13px] font-semibold text-white/90">AI Mastery</span>
        <div className="ml-auto flex items-center gap-1.5">
          <SyncDot loading={loading} error={error} />
          <span className="text-[10px] text-white/35">
            {error !== null ? 'sync error' : loading ? 'syncing' : 'synced'}
          </span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-48 md:flex-col md:bg-sidebar">
        {/* Logo + wordmark + sync */}
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br from-trypan to-[#0053EC] text-[10px] font-extrabold text-white">
            AI
          </div>
          <div>
            <span className="text-[13px] font-semibold tracking-tight text-white/90">
              AI Mastery
            </span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <SyncDot loading={loading} error={error} />
              <span className="text-[10px] text-white/35">
                {error !== null ? 'sync error' : loading ? 'syncing' : 'synced'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav aria-label="Main navigation" className="flex-1 px-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              if (item.disabled) {
                return (
                  <li key={item.label}>
                    <span className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-white/35">
                      {item.icon}
                      {item.label}
                      <span className="ml-auto rounded-full bg-white/8 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/40">
                        Soon
                      </span>
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
                        ? 'flex items-center gap-2.5 rounded-md bg-trypan/35 px-3 py-2 text-[13px] font-medium text-white'
                        : 'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-white/55 transition-colors hover:bg-white/8 hover:text-white'
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
      <div className="pb-16 md:ml-48 md:pb-0">
        {error !== null && (
          <div className="px-4 pt-4 md:px-6">
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        )}
        <main>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-edge bg-canvas md:hidden"
      >
        {NAV_ITEMS.filter((item): item is NavItem & { to: string; disabled?: false } => !item.disabled).map(
          (item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] ${
                  isActive ? 'text-trypan' : 'text-ink-sub'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ),
        )}
      </nav>
    </div>
  )
}
