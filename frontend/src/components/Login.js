import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

// API Base URL - Production vs Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

const Login = ({ onLogin, testResult }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Formular-Validierung
  const [validation, setValidation] = useState({
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '' }
  });

  /**
   * Handler für Eingabe-Änderungen
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validierung bei Eingabe
    validateField(name, value);
  };

  /**
   * Validiert ein einzelnes Feld
   */
  const validateField = (fieldName, value) => {
    let isValid = true;
    let message = '';

    switch (fieldName) {
      case 'email':
        if (!value) {
          isValid = false;
          message = 'Email ist erforderlich';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          isValid = false;
          message = 'Bitte geben Sie eine gültige Email-Adresse ein';
        }
        break;
      
      case 'password':
        if (!value) {
          isValid = false;
          message = 'Passwort ist erforderlich';
        } else if (value.length < 3) {
          isValid = false;
          message = 'Passwort muss mindestens 3 Zeichen lang sein';
        }
        break;
      
      default:
        break;
    }

    setValidation(prev => ({
      ...prev,
      [fieldName]: { isValid, message }
    }));

    return isValid;
  };

  /**
   * Validiert das gesamte Formular
   */
  const validateForm = () => {
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);
    
    return emailValid && passwordValid;
  };

  /**
   * Handler für Formular-Submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Formular-Validierung
    if (!validateForm()) {
      setError('Bitte korrigieren Sie die Fehler im Formular');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, formData, {
        withCredentials: true
      });

      if (response.data.success) {
        setSuccess('Anmeldung erfolgreich!');
        setFormData({ email: '', password: '' });
        
        // Kurze Verzögerung für UX
        setTimeout(() => {
          onLogin(response.data.user);
        }, 500);
      } else {
        setError(response.data.error || 'Anmeldung fehlgeschlagen');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Ungültige Anmeldedaten');
      } else if (error.response?.status === 500) {
        setError('Server-Fehler. Bitte versuchen Sie es später erneut.');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler für Demo-Login
   */
  const handleDemoLogin = (role) => {
    setFormData({
      email: role,
      password: role
    });
    
    // Automatischer Submit nach kurzer Verzögerung
    setTimeout(() => {
      handleSubmit(new Event('submit'));
    }, 100);
  };

  /**
   * Handler für Passwort-Sichtbarkeit
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo-section">
            <div className="logo">⏰</div>
            <h1>Zeiterfassung</h1>
            <p>Professionelle Zeiterfassung für Monteure</p>
          </div>
        </div>

        {/* Backend-Status */}
        <div className="backend-status">
          <div className={`status-indicator ${testResult === '✅ Verbunden' ? 'connected' : 'disconnected'}`}>
            <span className="status-icon">
              {testResult === '✅ Verbunden' ? '🟢' : '🔴'}
            </span>
            <span className="status-text">{testResult}</span>
          </div>
        </div>

        {/* Login-Formular */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email-Adresse
            </label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${!validation.email.isValid ? 'error' : ''}`}
                placeholder="ihre.email@beispiel.de"
                disabled={loading}
                autoComplete="email"
              />
              {!validation.email.isValid && (
                <div className="error-message">{validation.email.message}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Passwort
            </label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-input ${!validation.password.isValid ? 'error' : ''}`}
                placeholder="Ihr Passwort"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
              {!validation.password.isValid && (
                <div className="error-message">{validation.password.message}</div>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="message error">
              <span className="message-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="message success">
              <span className="message-icon">✅</span>
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-large login-btn"
            disabled={loading || !formData.email || !formData.password}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Anmelden...
              </>
            ) : (
              'Anmelden'
            )}
          </button>
        </form>

        {/* Demo-Login */}
        <div className="demo-section">
          <div className="demo-header">
            <span className="demo-icon">🧪</span>
            <span className="demo-text">Demo-Anmeldung</span>
          </div>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-secondary demo-btn"
              onClick={() => handleDemoLogin('monteur')}
              disabled={loading}
            >
              <span className="demo-icon">👷</span>
              Monteur
            </button>
            <button
              type="button"
              className="btn btn-secondary demo-btn"
              onClick={() => handleDemoLogin('buero')}
              disabled={loading}
            >
              <span className="demo-icon">🏢</span>
              Büro
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <div className="footer-links">
            <button className="footer-link">Passwort vergessen?</button>
            <span className="separator">•</span>
            <button className="footer-link">Hilfe</button>
            <span className="separator">•</span>
            <button className="footer-link">Kontakt</button>
          </div>
          <div className="footer-copyright">
            © 2025 Zeiterfassung-System
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
