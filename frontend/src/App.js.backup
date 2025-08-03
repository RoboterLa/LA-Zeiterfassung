import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// API Configuration
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

// Simple Auth Context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    try {
      // Simulate login for now
      const mockUser = {
        id: 1,
        username: username,
        role: username === 'admin' ? 'admin' : 'monteur',
        name: username === 'admin' ? 'Administrator' : 'Monteur'
      };
      setUser(mockUser);
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      const response = await axios.get('/health');
      console.log('Health check:', response.data);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Components
const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h2>Lackner Aufzüge - Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Benutzername:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin oder monteur"
              required
            />
          </div>
          <div className="form-group">
            <label>Passwort:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="beliebiges Passwort"
              required
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Anmelden
          </button>
        </form>
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p><strong>Test-Accounts:</strong></p>
          <p>Admin: admin / beliebiges Passwort</p>
          <p>Monteur: monteur / beliebiges Passwort</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <div className="header">
        <div className="container">
          <h1>Lackner Aufzüge - Dashboard</h1>
          <p>Willkommen, {user.name} ({user.role})</p>
          <button onClick={logout} className="btn btn-primary">Abmelden</button>
        </div>
      </div>
      <div className="container">
        <div className="card">
          <h2>Dashboard v1.0 - Clean Version</h2>
          <p>Dies ist eine saubere, neue Version des Zeiterfassung-Systems.</p>
          <p><strong>Benutzer:</strong> {user.username}</p>
          <p><strong>Rolle:</strong> {user.role}</p>
          <p><strong>Version:</strong> Clean v1.0</p>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container">Laden...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
