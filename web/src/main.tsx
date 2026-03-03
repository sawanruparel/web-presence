import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './style.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/error-boundary.tsx'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary context="Root">
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
)
