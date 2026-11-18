import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Boot Novus by Pendo once with an anonymous visitor. This app has no sign-in,
// so the SDK keeps tracking the anonymous visitor it resolves from storage.
pendo.initialize({
  visitor: {
    id: '',
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
