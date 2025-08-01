import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BueroPage from './pages/BueroPage';
import UrlaubPage from './pages/UrlaubPage';
import ZeiterfassungPage from './pages/ZeiterfassungPage';
import ProtectedRoute from './components/ProtectedRoute';

// Set API base URL
const axios = require('axios');
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Root route - always shows login */}
          <Route path="/" element={<LoginPage />} />
          
          {/* Monteur Dashboard - separate route */}
          <Route 
            path="/monteur_dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Dashboard */}
          <Route 
            path="/buero" 
            element={
              <ProtectedRoute>
                <BueroPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Other pages */}
          <Route 
            path="/urlaub" 
            element={
              <ProtectedRoute>
                <UrlaubPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/zeiterfassung" 
            element={
              <ProtectedRoute>
                <ZeiterfassungPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Logout route */}
          <Route path="/logout" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 