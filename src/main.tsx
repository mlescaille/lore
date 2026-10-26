import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/outfit/wght.css'
import './index.css'
import App from './App.tsx'
import { currentLook } from './looks/look.ts'

async function boot() {
  const look = currentLook()
  if (look !== 'desk') {
    await import('./looks/picker.css')
    if (look === 'scrapbook') await import('./looks/scrapbook.css')
    if (look === 'tabloid') await import('./looks/tabloid.css')
    if (look === 'memoir') await import('./looks/memoir.css')
    if (look === 'receipt') await import('./looks/receipt.css')
    if (look === 'poster') await import('./looks/poster.css')
    if (look === 'archive') await import('./looks/archive.css')
    if (look === 'retro') await import('./looks/retro.css')
    document.documentElement.dataset.look = look
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
