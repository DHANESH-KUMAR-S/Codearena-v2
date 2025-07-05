import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';

function App() {
  const [currentView, setCurrentView] = useState('homepage'); // 'homepage', 'auth', 'app'
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register'
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setCurrentView('app');
    }
  }, []);

  const handleGetStarted = () => {
    setCurrentView('auth');
    setAuthMode('login');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('app');
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setCurrentView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('homepage');
  };

  const switchToRegister = () => {
    setAuthMode('register');
  };

  const switchToLogin = () => {
    setAuthMode('login');
  };

  // Render based on current view
  if (currentView === 'homepage') {
    return <HomePage onGetStarted={handleGetStarted} />;
  }

  if (currentView === 'auth') {
    return authMode === 'login' ? (
      <Login onLogin={handleLogin} onSwitchToRegister={switchToRegister} />
    ) : (
      <Register onRegister={handleRegister} onSwitchToLogin={switchToLogin} />
    );
  }

  if (currentView === 'app') {
    return <Home user={user} onLogout={handleLogout} />;
  }

  return <HomePage onGetStarted={handleGetStarted} />;
}

export default App; 