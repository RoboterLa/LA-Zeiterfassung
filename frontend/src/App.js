import React, { useState, useEffect } from 'react';
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
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Lade...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole && user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <div>
                  <Header />
                  <Dashboard />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/arbeitszeit" element={
              <ProtectedRoute>
                <div>
                  <Header />
                  <ArbeitszeitPage />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/auftraege" element={
              <ProtectedRoute>
                <div>
                  <Header />
                  <AuftraegePage />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/urlaub" element={
              <ProtectedRoute>
                <div>
                  <Header />
                  <UrlaubPage />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/zeiterfassung" element={
              <ProtectedRoute>
                <div>
                  <Header />
                  <ZeiterfassungPage />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/buero" element={
              <ProtectedRoute requiredRole="Admin">
                <div>
                  <Header />
                  <BueroPage />
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 