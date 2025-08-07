import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Layout from './components/Layout';
import MonteurDashboard from './components/MonteurDashboard';
import BueroDashboard from './components/BueroDashboard';
import ArbeitszeitEingabe from './components/ArbeitszeitEingabe';
import ZeiterfassungEingabe from './components/ZeiterfassungEingabe';
import Auftraege from './components/Auftraege';
import Profil from './components/Profil';
import Login from './components/Login';
import './App.css';

// API Base URL - Production vs Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

// Globale axios-Konfiguration für Session-Cookies
axios.defaults.withCredentials = true;

/**
 * Protected Route Component
 * Verhindert Zugriff auf geschützte Routen ohne Authentifizierung
 */
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('Prüfe...');

  useEffect(() => {
    checkAuthStatus();
    testBackend();
  }, []);

  /**
   * Testet die Backend-Verbindung
   */
  const testBackend = async () => {
    try {
      await axios.get(`${API_BASE_URL}/health`);
      setBackendStatus('✅ Verbunden');
    } catch (error) {
      setBackendStatus('❌ Fehler');
    }
  };

  /**
   * Überprüft den aktuellen Authentifizierungsstatus
   */
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      // Benutzer ist nicht angemeldet - das ist normal
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler für erfolgreiche Anmeldung
   */
  const handleLogin = (userData) => {
    setUser(userData);
  };

  /**
   * Handler für Abmeldung
   */
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
    } catch (error) {
      // Logout-Fehler ignorieren - User-State trotzdem zurücksetzen
    } finally {
      setUser(null);
    }
  };

  // Loading-Zustand
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Lade...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              !user ? (
                <Login 
                  onLogin={handleLogin} 
                  testResult={backendStatus}
                />
              ) : (
                <Navigate to="/monteur/dashboard" replace />
              )
            } 
          />

          {/* Monteur Routes */}
          <Route 
            path="/monteur/dashboard" 
            element={
              <ProtectedRoute user={user}>
                <Layout user={user} onLogout={handleLogout}>
                  <MonteurDashboard user={user} onLogout={handleLogout} />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/monteur/zeiterfassungen" 
            element={
              <ProtectedRoute user={user}>
                <Layout user={user} onLogout={handleLogout}>
                  <ZeiterfassungEingabe user={user} />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/monteur/arbeitszeit" 
            element={
              <ProtectedRoute user={user}>
                <Layout user={user} onLogout={handleLogout}>
                  <ArbeitszeitEingabe user={user} />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/monteur/auftraege" 
            element={
              <ProtectedRoute user={user}>
                <Layout user={user} onLogout={handleLogout}>
                  <Auftraege />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/monteur/profil" 
            element={
              <ProtectedRoute user={user}>
                <Layout user={user} onLogout={handleLogout}>
                  <Profil user={user} />
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Büro Routes */}
          <Route 
            path="/buero/dashboard" 
            element={
              <ProtectedRoute user={user}>
                <Layout user={user} onLogout={handleLogout}>
                  <BueroDashboard user={user} onLogout={handleLogout} />
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
