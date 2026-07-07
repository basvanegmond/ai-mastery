import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Dashboard' },
  { to: '/train', label: 'Train' },
]

export default function Layout() {
  return (
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
      <main className="mx-auto max-w-5xl">
        <Outlet />
      </main>
    </div>
  )
}
