import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('MediBot crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white', fontFamily: 'Inter, sans-serif', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏥</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>MediBot</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2rem' }}>
            AI Healthcare Assistant — Starting up...
          </p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem', maxWidth: '400px' }}>
            The server may be waking up (free tier). Please wait 30 seconds and refresh.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 2rem', background: 'white', color: '#764ba2',
              border: 'none', borderRadius: '0.75rem', fontWeight: 700,
              fontSize: '1rem', cursor: 'pointer'
            }}
          >
            🔄 Reload App
          </button>
          <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1.5rem', maxWidth: '500px', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '0.5rem', wordBreak: 'break-word' }}>
            Error: {this.state.error?.toString()}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
