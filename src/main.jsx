import './index.css'
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

const App = lazy(() => import('./App.jsx'))
const DiwaliPage = lazy(() => import('./components/DiwaliPage.jsx'))
const isDiwali = window.location.pathname.replace(/\/+$/, '') === '/diwali'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div style={{ padding: 40 }}>{isDiwali ? 'Lighting the courtyard…' : 'Loading Awba…'}</div>}>
      {isDiwali ? <DiwaliPage /> : <App />}
    </Suspense>
  </StrictMode>
)
