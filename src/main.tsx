import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureDailyReset } from './platform/web/dailyReset/ensureDailyReset'

// Must run before App mounts: React state below (e.g. useState(loadCompletedBenefitIds))
// reads storage synchronously on first render, so daily reset has to have
// already happened by then.
ensureDailyReset()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
