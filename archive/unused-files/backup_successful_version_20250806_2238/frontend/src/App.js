import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MonteurDashboard from './components/MonteurDashboard';
import BueroDashboard from './components/BueroDashboard';
import './App.css';

// API Base URL für Production/Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

// Globale axios-Konfiguration für Session-Cookies
axios.defaults.withCredentials = true;

// Login Component
function Login({ onLogin, testResult }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Sending login request...');
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      }, {
        withCredentials: true
      });

      console.log('Login response:', response.data);
      if (response.data.success && response.data.user) {
        onLogin(response.data.user);
        setError('');
        
        // Navigate directly to the correct dashboard
        if (response.data.user.role === 'monteur') {
          navigate('/monteur', { replace: true });
        } else if (response.data.user.role === 'buero') {
          navigate('/buero', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
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
              placeholder="monteur"
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
              <div><strong>Monteur:</strong> monteur / monteur</div>
              <div><strong>Büro:</strong> buero / buero</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Dashboard Router Component
function DashboardRouter({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'monteur' && location.pathname === '/') {
        navigate('/monteur', { replace: true });
      } else if (user.role === 'buero' && location.pathname === '/') {
        navigate('/buero', { replace: true });
      }
    }
  }, [user, navigate, location.pathname]);

  const handleLogout = async () => {
    await onLogout();
    navigate('/login', { replace: true });
  };

  return (
    <Routes>
      <Route 
        path="/monteur" 
        element={
          <ProtectedRoute user={user}>
            <MonteurDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/buero" 
        element={
          <ProtectedRoute user={user}>
            <BueroDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute user={user}>
            <div className="app">
              <header className="header">
                <div className="logo-container">
                  <h1>Lackner Aufzüge</h1>
                </div>
                <div className="user-info">
                  <span>{user?.name}</span>
                  <button onClick={handleLogout} className="logout-btn">Abmelden</button>
                </div>
              </header>
              <main className="main">
                <div className="dashboard">
                  <h2>Willkommen, {user?.name}!</h2>
                  <p>Dashboard für {user?.role} wird implementiert...</p>
                  <div style={{marginTop: '2rem'}}>
                    <button 
                      onClick={() => navigate('/monteur')} 
                      className="btn btn-primary"
                      style={{marginRight: '1rem'}}
                    >
                      Monteur Dashboard
                    </button>
                    <button 
                      onClick={() => navigate('/buero')} 
                      className="btn btn-primary"
                    >
                      Büro Dashboard
                    </button>
                  </div>
                </div>
              </main>
            </div>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [testResult, setTestResult] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    testBackend();
  }, []);

  const testBackend = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      setTestResult(`Backend OK: ${response.data.status}`);
    } catch (error) {
      setTestResult(`Backend Error: ${error.message}`);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
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

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
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

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} testResult={testResult} />
          } 
        />
        <Route 
          path="/*" 
          element={<DashboardRouter user={user} onLogout={handleLogout} />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
