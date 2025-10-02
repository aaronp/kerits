import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './index.css'
import './lib/keri' // Initialize crypto setup for @noble/ed25519
import App from './App.tsx'

// Make Buffer globally available for bip39
globalThis.Buffer = Buffer

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
