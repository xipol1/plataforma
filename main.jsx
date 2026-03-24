import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Algo salió mal
            </h1>
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error inesperado. Por favor, recarga la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootEl = document.getElementById('root')
const escapeHtml = (value) => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
const showFatalError = (error) => {
  if (!rootEl) return
  const message = error instanceof Error ? error.message : String(error)
  rootEl.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;padding:24px;"><div style="max-width:720px;font-family:Inter,system-ui,Arial,sans-serif;"><h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Error al iniciar la aplicación</h1><pre style="white-space:pre-wrap;word-break:break-word;background:#111827;color:#f9fafb;padding:12px;border-radius:10px;margin:0;">${escapeHtml(message)}</pre></div></div>`
}

window.addEventListener('error', (event) => {
  showFatalError(event.error || event.message || event)
})

window.addEventListener('unhandledrejection', (event) => {
  showFatalError(event.reason || event)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
