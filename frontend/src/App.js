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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RedirectToLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/arbeitszeit" element={<ArbeitszeitPage />} />
            <Route path="/auftraege" element={<AuftraegePage />} />
            <Route path="/urlaub" element={<UrlaubPage />} />
            <Route path="/zeiterfassung" element={<ZeiterfassungPage />} />
            <Route path="/buero" element={<BueroPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 