import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Full from './pages/Full'
import Quick from './pages/Quick'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quick" element={<Quick />} />
          <Route path="/full" element={<Full />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
