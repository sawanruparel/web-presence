import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/error-boundary.tsx'
import { initializeMockApi } from './utils/mock-interceptor'

// Initialize mock API in development mode
initializeMockApi()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <ErrorBoundary context="Root">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
