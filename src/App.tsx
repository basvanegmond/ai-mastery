import { Shell } from './components/layout/Shell'
import { Dashboard } from './components/dashboard/Dashboard'
import { TrainingMode } from './components/training/TrainingMode'
import { ImportScreen } from './components/import/ImportScreen'
import { SettingsScreen } from './components/settings/SettingsScreen'

export default function App() {
  return (
    <Shell>
      {(activeTab) => {
        switch (activeTab) {
          case 'dashboard': return <Dashboard />
          case 'train':     return <TrainingMode />
          case 'import':    return <ImportScreen />
          case 'settings':  return <SettingsScreen />
        }
      }}
    </Shell>
  )
}
