import React from 'react';

// ⚡ APEX CTO OVERRIDE: RENDER RESILIENCE LOCKDOWN ⚡
// Catches any runtime error in the component tree and renders a
// professional fallback screen instead of a blank white page.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details for diagnostics without crashing the app.
    console.error('VAULT OFFLINE — SECURE CONNECTION INTERRUPTED:', error, errorInfo);
  }

  handleReconnect = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#09090b',
            color: '#fafafa',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            padding: '24px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div
              style={{
                fontSize: '12px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: '#a1a1aa',
                marginBottom: '16px',
              }}
            >
              ⚠ System Alert
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                margin: '0 0 12px 0',
              }}
            >
              VAULT OFFLINE
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#a1a1aa',
                lineHeight: 1.6,
                margin: '0 0 32px 0',
              }}
            >
              The secure connection was interrupted. Please re-establish the
              connection to regain access to the catalog.
            </p>
            <button
              onClick={this.handleReconnect}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 32px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(5, 150, 105, 0.35)',
                transition: 'background 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#059669';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(5, 150, 105, 0.35)';
              }}
            >
              Reconnect
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
