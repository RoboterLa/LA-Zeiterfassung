import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BueroPage from './pages/BueroPage';
import UrlaubPage from './pages/UrlaubPage';
import ZeiterfassungPage from './pages/ZeiterfassungPage';
import ProtectedRoute from './components/ProtectedRoute';
import axios from 'axios';

// Set API base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/buero" element={
              <ProtectedRoute>
                <BueroPage />
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
            <Route path="/logout" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 