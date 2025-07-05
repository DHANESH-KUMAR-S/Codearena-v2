import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Check if the error is related to ResizeObserver
    if (error && error.message && error.message.includes('ResizeObserver')) {
      // Don't update state for ResizeObserver errors
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Suppress ResizeObserver errors
    if (error && error.message && error.message.includes('ResizeObserver')) {
      console.log('Suppressed ResizeObserver error:', error.message);
      return;
    }
    
    // Log other errors normally
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: 'white',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2>Something went wrong.</h2>
          <p>Please refresh the page and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 