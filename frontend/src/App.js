import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
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

// Simple app component that shows login or dashboard
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Laden...</div>;
  }
  
  if (!isAuthenticated()) {
    return <LoginPage />;
  }
  
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/login" element={<LoginPage />} />
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

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Laden...</div>;
  }
  
  if (!isAuthenticated()) {
    return <LoginPage />;
  }
  
  return children;
};

export default App; 