import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AppContext } from './contexts/AppContext'
import { useAppState } from './hooks/useAppState'
import Dashboard from './pages/Dashboard'
import Full from './pages/Full'
import Intake from './pages/Intake'
import Quick from './pages/Quick'

function LoadingScreen(): JSX.Element {
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

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-sub px-4">
      <div className="text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded border border-edge px-3 py-2 text-sm text-ink-sub hover:bg-canvas"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { state, loading, error, refetch } = useAppState()

  if (loading && state === null) return <LoadingScreen />
  if (state === null && error !== null) return <ErrorScreen error={error} onRetry={refetch} />

  return (
    <AppContext.Provider value={{ state, refetch }}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout loading={loading} error={error} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quick" element={<Quick />} />
            <Route path="/full" element={<Full />} />
          </Route>
          <Route path="/intake" element={<Intake />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  )
}
