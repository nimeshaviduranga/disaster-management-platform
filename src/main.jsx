import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with update prompt
const updateSW = registerSW({
  onNeedRefresh() {
    // Show update prompt when new version is available
    if (confirm('🔄 New version available! Click OK to update.')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
  onRegistered(registration) {
    // Check for updates every 5 minutes
    if (registration) {
      setInterval(() => {
        registration.update()
      }, 5 * 60 * 1000)
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
