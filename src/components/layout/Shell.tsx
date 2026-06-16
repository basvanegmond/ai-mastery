import { useState, useEffect } from 'react'
import { useMasteryStore } from '../../store/masteryStore'

export type Tab = 'overview' | 'quick' | 'full' | 'import' | 'settings'

interface ShellProps {
  children: (activeTab: Tab, theme: 'dark' | 'light') => React.ReactNode
}

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview',  label: 'Overview',  icon: '◉' },
  { id: 'quick',     label: 'Quick',     icon: '⚡' },
  { id: 'full',      label: 'Full',      icon: '◎' },
  { id: 'import',    label: 'Import',    icon: '↑' },
  { id: 'settings',  label: 'Settings',  icon: '⚙' },
]

export function Shell({ children }: ShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
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
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (githubToken) syncFromGithub()
    touchLastActive()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const syncColor =
    syncStatus === 'syncing' ? 'var(--gold)'
    : syncStatus === 'error' || syncStatus === 'conflict' ? 'var(--danger)'
    : githubToken ? 'var(--success)'
    : 'var(--text-muted)'

  const syncLabel =
    syncStatus === 'syncing' ? 'syncing…'
    : syncStatus === 'conflict' ? 'conflict'
    : syncStatus === 'error' ? 'sync error'
    : githubToken ? 'synced'
    : 'local only'

  return (
    <div className="flex h-full min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Side nav — desktop */}
      {isDesktop && (
        <nav
          className="flex flex-col gap-1 p-4 w-52 shrink-0"
          style={{
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
          }}
        >
          <div className="mb-6 px-2 pt-1">
            <h1 className="text-lg leading-tight" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
              AI Mastery
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: syncColor, display: 'inline-block', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                {syncLabel}
              </span>
            </div>
          </div>

          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="interactive flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left w-full"
              style={{
                background: activeTab === item.id ? 'var(--active-bg)' : 'transparent',
                color: activeTab === item.id ? 'var(--gold)' : 'var(--text-secondary)',
                fontFamily: 'DM Mono, monospace',
                borderLeft: activeTab === item.id ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="interactive flex items-center gap-2 px-3 py-2 rounded-lg text-xs w-full"
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
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
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h1 className="text-sm font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>AI Mastery</h1>
            <div className="flex items-center gap-3">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: syncColor, display: 'inline-block' }} />
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="interactive text-sm px-2 py-1 rounded-lg"
                style={{ color: 'var(--text-secondary)', background: 'transparent' }}
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
          className="fixed bottom-0 left-0 right-0 flex z-10"
          style={{
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="interactive flex-1 flex flex-col items-center gap-0.5 py-2"
              style={{
                color: activeTab === item.id ? 'var(--gold)' : 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace',
                background: activeTab === item.id ? 'var(--active-bg)' : 'transparent',
                borderTop: activeTab === item.id ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px' }}>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
