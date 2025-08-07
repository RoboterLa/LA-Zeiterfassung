import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/me', {
        withCredentials: true
      });
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('Nicht angemeldet:', error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  if (user) {
    return (
      <div className="app">
        <header className="header">
          <div className="logo-container">
            <img src="/images/lackner-logo.png" alt="Lackner Aufzüge" className="logo" />
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
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-background">
          <div className="login-content">
            <div className="logo-section">
              <img src="/images/lackner-logo.png" alt="Lackner Aufzüge" className="login-logo" />
            </div>
            <h1 className="login-title">Lackner Aufzüge</h1>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-form-container">
          <div className="mobile-logo">
            <img src="/images/lackner-logo.png" alt="Lackner Aufzüge" className="mobile-logo-img" />
            <h2>Lackner Aufzüge</h2>
            <p>Zeiterfassung System</p>
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
    </div>
  );
}

export default App;
