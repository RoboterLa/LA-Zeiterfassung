import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ArbeitszeitTimer.css';

// API Base URL - Production vs Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

const ArbeitszeitTimer = ({ onTimeEntrySaved }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Timer-States
  const [workStartTime, setWorkStartTime] = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    loadCurrentStatus();

    return () => clearInterval(timer);
  }, []);

  /**
   * Lädt aktuellen Status vom Server
   */
  const loadCurrentStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/current-status`);
      if (response.data.success) {
        if (onTimeEntrySaved) onTimeEntrySaved();
      }
    } catch (error) {
      // Fehler beim Laden des Status - verwende Standard-Werte
    }
  };

  /**
   * Formatiert Dauer in HH:MM:SS Format
   */
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  /**
   * Berechnet aktuelle Arbeitszeit
   */
  const getCurrentWorkTime = () => {
    if (!workStartTime) return 0;
    return Math.floor((currentTime - workStartTime) / 1000);
  };

  /**
   * Berechnet aktuelle Pausenzeit
   */
  const getCurrentBreakTime = () => {
    if (!breakStartTime) return 0;
    return Math.floor((currentTime - breakStartTime) / 1000);
  };

  /**
   * Handler für Einstempeln
   */
  const handleClockIn = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/clock-in`);
      if (response.data.success) {
        setMessage(response.data.message);
        await loadCurrentStatus();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Einstempeln');
    }
    setLoading(false);
  };

  /**
   * Handler für Ausstempeln
   */
  const handleClockOut = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/clock-out`);
      if (response.data.success) {
        setMessage(response.data.message);
        await loadCurrentStatus();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Ausstempeln');
    }
    setLoading(false);
  };

  /**
   * Handler für Pause beginnen
   */
  const handleBreakStart = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/break-start`);
      if (response.data.success) {
        setMessage(response.data.message);
        await loadCurrentStatus();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Pause starten');
    }
    setLoading(false);
  };

  /**
   * Handler für Pause beenden
   */
  const handleBreakEnd = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/break-end`);
      if (response.data.success) {
        setMessage(response.data.message);
        await loadCurrentStatus();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Pause beenden');
    }
    setLoading(false);
  };

  return (
    <div className="arbeitszeit-timer">
      {/* Timer-Anzeige */}
      <div className="timer-display">
        <div className="current-time">
          <span className="time-label">Aktuelle Zeit</span>
          <span className="time-value">{currentTime.toLocaleTimeString('de-DE')}</span>
        </div>
        
        {isWorking && (
          <div className="work-time">
            <span className="time-label">Arbeitszeit</span>
            <span className="time-value work">{formatDuration(getCurrentWorkTime())}</span>
          </div>
        )}
        
        {isOnBreak && (
          <div className="break-time">
            <span className="time-label">Pausenzeit</span>
            <span className="time-value break">{formatDuration(getCurrentBreakTime())}</span>
          </div>
        )}
      </div>

      {/* Status-Anzeige */}
      <div className="status-display">
        <div className={`status-indicator ${isWorking ? 'working' : 'idle'}`}>
          <span className="status-icon">{isWorking ? '🟢' : '🔴'}</span>
          <span className="status-text">{isWorking ? 'Arbeitet' : 'Nicht eingestempelt'}</span>
        </div>
        
        {isOnBreak && (
          <div className="status-indicator break">
            <span className="status-icon">⏸️</span>
            <span className="status-text">Pause</span>
          </div>
        )}
      </div>

      {/* Steuerungs-Buttons */}
      <div className="timer-controls">
        {!isWorking ? (
          <button 
            className="btn btn-primary btn-large"
            onClick={handleClockIn}
            disabled={loading}
          >
            {loading ? 'Einstempeln...' : 'Einstempeln'}
          </button>
        ) : (
          <div className="control-buttons">
            {!isOnBreak ? (
              <button 
                className="btn btn-secondary"
                onClick={handleBreakStart}
                disabled={loading}
              >
                {loading ? 'Pause...' : 'Pause'}
              </button>
            ) : (
              <button 
                className="btn btn-secondary"
                onClick={handleBreakEnd}
                disabled={loading}
              >
                {loading ? 'Weiter...' : 'Weiter'}
              </button>
            )}
            
            <button 
              className="btn btn-danger"
              onClick={handleClockOut}
              disabled={loading}
            >
              {loading ? 'Ausstempeln...' : 'Ausstempeln'}
            </button>
          </div>
        )}
      </div>

      {/* Nachrichten */}
      {message && (
        <div className={`timer-message ${message.includes('Fehler') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Statistiken */}
      <div className="timer-stats">
        <div className="stat-item">
          <span className="stat-label">Heute gearbeitet</span>
          <span className="stat-value">{formatDuration(getCurrentWorkTime())}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Pausen heute</span>
          <span className="stat-value">{formatDuration(getCurrentBreakTime())}</span>
        </div>
      </div>
    </div>
  );
};

export default ArbeitszeitTimer; 