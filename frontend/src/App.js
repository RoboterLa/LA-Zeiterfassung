import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ArbeitszeitPage from './pages/ArbeitszeitPage';
import AuftraegePage from './pages/AuftraegePage';
import UrlaubPage from './pages/UrlaubPage';
import ZeiterfassungPage from './pages/ZeiterfassungPage';
import BueroPage from './pages/BueroPage';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// API Configuration
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';
axios.defaults.withCredentials = true;

// Simple redirect component
const RedirectToLogin = () => {
  React.useEffect(() => {
    window.location.href = '/login';
  }, []);
  return <div>Weiterleitung zur Anmeldung...</div>;
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Laden...</div>;
  }
  
  if (!isAuthenticated()) {
    return <RedirectToLogin />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RedirectToLogin />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/arbeitszeit" element={
              <ProtectedRoute>
                <ArbeitszeitPage />
              </ProtectedRoute>
            } />
            <Route path="/auftraege" element={
              <ProtectedRoute>
                <AuftraegePage />
              </ProtectedRoute>
            } />
            <Route path="/urlaub" element={
              <ProtectedRoute>
                <UrlaubPage />
              </ProtectedRoute>
            } />
            <Route path="/zeiterfassung" element={
              <ProtectedRoute>
                <ZeiterfassungPage />
              </ProtectedRoute>
            } />
            <Route path="/buero" element={
              <ProtectedRoute>
                <BueroPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 