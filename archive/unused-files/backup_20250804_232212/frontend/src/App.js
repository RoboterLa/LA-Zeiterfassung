import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MonteurDashboard from './components/MonteurDashboard';
import BueroDashboard from './components/BueroDashboard';
import './App.css';

// Globale axios-Konfiguration für Session-Cookies
axios.defaults.withCredentials = true;

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [testResult, setTestResult] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    testBackend();
  }, []);

  const testBackend = async () => {
    try {
      const response = await axios.get('http://localhost:8080/health');
      setTestResult(`Backend OK: ${response.data.status}`);
    } catch (error) {
      setTestResult(`Backend Error: ${error.message}`);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/auth/me', {
        withCredentials: true
      });
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Nicht angemeldet:', error.message);
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Sending login request...');
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password
      }, {
        withCredentials: true
      });

      console.log('Login response:', response.data);
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        setError('');
      } else {
        setError('Login fehlgeschlagen - keine Benutzerdaten erhalten');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8080/api/auth/logout', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="login-container">
        <div className="login-form-container">
          <div className="login-header">
            <h1>Lackner Aufzüge</h1>
            <p>Zeiterfassung System</p>
          </div>
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <p>Lade...</p>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    // Render appropriate dashboard based on user role
    if (user.role === 'monteur') {
      return <MonteurDashboard user={user} onLogout={handleLogout} />;
    } else if (user.role === 'buero') {
      return <BueroDashboard user={user} onLogout={handleLogout} />;
    }
    
    // Default dashboard for other roles
    return (
      <div className="app">
        <header className="header">
          <div className="logo-container">
            <h1>Lackner Aufzüge</h1>
          </div>
          <div className="user-info">
            <span>{user.name}</span>
            <button onClick={handleLogout} className="logout-btn">Abmelden</button>
          </div>
        </header>
        <main className="main">
          <div className="dashboard">
            <h2>Willkommen, {user.name}!</h2>
            <p>Dashboard für {user.role} wird implementiert...</p>
            <p>Backend Status: {testResult}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-text">LA</div>
          </div>
          <h1>Lackner Aufzüge</h1>
          <p>Zeiterfassung System</p>
        </div>

        <div className="backend-status">
          <strong>Backend Status:</strong> {testResult}
        </div>

        <h2 className="login-heading">Anmelden</h2>
        <p className="login-subtitle">Melden Sie sich mit Ihren Zugangsdaten an</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="monteur"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="monteur123"
              required
              className="form-input"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>

          <div className="test-accounts">
            <h3>Test-Accounts:</h3>
            <div className="account-list">
              <div><strong>Monteur:</strong> monteur / monteur123</div>
              <div><strong>Admin:</strong> admin / admin123</div>
              <div><strong>Büro:</strong> buero / buero123</div>
              <div><strong>Lohn:</strong> lohn / lohn123</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
