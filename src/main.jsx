import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 30, fontFamily: 'sans-serif', color: '#333' }}>
          <h2 style={{ color: '#c00' }}>Ocurrio un error</h2>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {String(this.state.error && (this.state.error.message || this.state.error))}
          </pre>
          <p>Revisa la consola (F12) para mas detalles.</p>
          <button onClick={() => this.setState({ error: null })} style={{ padding: '8px 14px' }}>Reintentar</button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
