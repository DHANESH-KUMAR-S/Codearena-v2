import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Suppress ResizeObserver errors globally
const suppressResizeObserverErrors = () => {
  // Override console.error
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
      return;
    }
    originalError.apply(console, args);
  };

  // Override console.warn
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('ResizeObserver')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && typeof event.reason === 'string' && 
        event.reason.includes('ResizeObserver')) {
      event.preventDefault();
    }
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && 
        event.error.message.includes('ResizeObserver')) {
      event.preventDefault();
      return false;
    }
  });

  // Override Error constructor to catch ResizeObserver errors
  const OriginalError = window.Error;
  window.Error = function(...args) {
    const error = new OriginalError(...args);
    if (error.message && error.message.includes('ResizeObserver')) {
      // Return a dummy error that won't be logged
      return {
        message: '',
        stack: '',
        name: 'Error'
      };
    }
    return error;
  };
  window.Error.prototype = OriginalError.prototype;
};

// Apply the suppression
suppressResizeObserverErrors();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
); 