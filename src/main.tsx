
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'

// Initialize the MSW worker in development mode
// async function initMockServiceWorker() {
//   if (process.env.NODE_ENV === 'development') {
//     const { worker } = await import('./mocks/browser')
//     return worker.start({
//       onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
//     })
//   }
//   return Promise.resolve()
// }

// Start the MSW worker and then render the app
// initMockServiceWorker().then(() => {
  const rootElement = document.getElementById("root")
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } else {
    console.error('Root element not found')
  }
// })
