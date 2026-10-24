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
    document.documentElement.dataset.look = look
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
