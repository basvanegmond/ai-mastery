import { useState, useEffect } from 'react'
import { useMasteryStore } from '../../store/masteryStore'

export type Tab = 'dashboard' | 'train' | 'import' | 'settings'

interface ShellProps {
  children: (activeTab: Tab, theme: 'dark' | 'light') => React.ReactNode
}

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉' },
  { id: 'train', label: 'Train', icon: '⚡' },
  { id: 'import', label: 'Import', icon: '↑' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export function Shell({ children }: ShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const syncStatus = useMasteryStore((s) => s.syncStatus)
  const syncFromGithub = useMasteryStore((s) => s.syncFromGithub)
  const githubToken = useMasteryStore((s) => s.githubToken)
  const touchLastActive = useMasteryStore((s) => s.touchLastActive)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  // Sync from GitHub on first load if token is available
  useEffect(() => {
    if (githubToken) syncFromGithub()
    touchLastActive()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const syncDot =
    syncStatus === 'syncing' ? '○'
    : syncStatus === 'error' || syncStatus === 'conflict' ? '●'
    : '●'
  const syncColor =
    syncStatus === 'syncing' ? 'text-[var(--gold)]'
    : syncStatus === 'error' || syncStatus === 'conflict' ? 'text-[var(--danger)]'
    : githubToken ? 'text-[var(--success)]'
    : 'text-[var(--text-muted)]'

  return (
    <div className="flex h-full min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Side nav — desktop */}
      {isDesktop && (
        <nav
          className="flex flex-col gap-2 p-4 w-52 shrink-0 border-r"
          style={{
            background: 'var(--surface)',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: '2px 0 12px rgba(0,0,0,0.3)',
          }}
        >
          <div className="mb-6 px-2">
            <h1 className="text-lg leading-tight" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
              AI<br />Mastery
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs ${syncColor}`}>{syncDot}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {syncStatus === 'syncing' ? 'syncing…'
                  : syncStatus === 'conflict' ? 'conflict'
                  : syncStatus === 'error' ? 'sync error'
                  : githubToken ? 'synced'
                  : 'local only'}
              </span>
            </div>
          </div>

          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-neo text-left w-full"
              style={{
                boxShadow: activeTab === item.id ? 'var(--neo-inset)' : 'var(--neo-raised)',
                background: 'var(--surface)',
                color: activeTab === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'DM Mono, monospace',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="mt-auto">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs w-full transition-neo"
              style={{
                boxShadow: 'var(--neo-raised)',
                background: 'var(--surface)',
                color: 'var(--text-secondary)',
                fontFamily: 'DM Mono, monospace',
              }}
            >
              <span>{theme === 'dark' ? '☀' : '◑'}</span>
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </nav>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {/* Mobile header */}
        {!isDesktop && (
          <header
            className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
            style={{
              background: 'var(--surface)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <h1 className="text-base" style={{ fontFamily: 'Syne, sans-serif' }}>AI Mastery</h1>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${syncColor}`}>{syncDot}</span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-base px-2 py-1 rounded-lg transition-neo"
                style={{ boxShadow: 'var(--neo-raised)', background: 'var(--surface)' }}
              >
                {theme === 'dark' ? '☀' : '◑'}
              </button>
            </div>
          </header>
        )}

        <div className="max-w-[1600px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children(activeTab, theme)}
        </div>
      </main>

      {/* Bottom nav — mobile */}
      {!isDesktop && (
        <nav
          className="fixed bottom-0 left-0 right-0 flex border-t z-10"
          style={{
            background: 'var(--surface)',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: '0 -2px 12px rgba(0,0,0,0.3)',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-neo"
              style={{
                color: activeTab === item.id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace',
                background: activeTab === item.id ? 'var(--bg2)' : 'transparent',
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
