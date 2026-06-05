import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PageLoader from './components/PageLoader.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PageLoader />
    <App />
  </StrictMode>,
)
