import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ArbeitszeitTimer.css';

const ArbeitszeitTimer = ({ onTimeEntrySaved, currentStatus: propCurrentStatus }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState(null);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Timer für aktuelle Zeit
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Lade aktuellen Status beim Start
  useEffect(() => {
    loadCurrentStatus();
  }, []);

  // Aktualisiere Work-Start-Zeit wenn Status sich ändert
  useEffect(() => {
    if (currentStatus?.is_working && currentStatus?.current_entry?.clock_in) {
      const startTime = new Date();
      const [hours, minutes, seconds] = currentStatus.current_entry.clock_in.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0));
      setWorkStartTime(startTime);
    } else {
      setWorkStartTime(null);
    }

    if (currentStatus?.break_status === 'on_break' && currentStatus?.current_entry?.break_start) {
      const breakTime = new Date();
      const [hours, minutes, seconds] = currentStatus.current_entry.break_start.split(':');
      breakTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0));
      setBreakStartTime(breakTime);
    } else {
      setBreakStartTime(null);
    }
  }, [currentStatus]);

  const loadCurrentStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/monteur/current-status');
      if (response.data.success) {
        setCurrentStatus(response.data);
        if (onTimeEntrySaved) onTimeEntrySaved();
      }
    } catch (error) {
      console.error('Error loading current status:', error);
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCurrentWorkTime = () => {
    if (!workStartTime) return 0;
    return Math.floor((currentTime - workStartTime) / 1000);
  };

  const getCurrentBreakTime = () => {
    if (!breakStartTime) return 0;
    return Math.floor((currentTime - breakStartTime) / 1000);
  };

  const handleClockIn = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post('http://localhost:8080/api/monteur/clock-in');
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

  const handleClockOut = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post('http://localhost:8080/api/monteur/clock-out');
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

  const handleStartBreak = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post('http://localhost:8080/api/monteur/start-break');
      if (response.data.success) {
        setMessage(response.data.message);
        await loadCurrentStatus();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Starten der Pause');
    }
    setLoading(false);
  };

  const handleEndBreak = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post('http://localhost:8080/api/monteur/end-break');
      if (response.data.success) {
        setMessage(response.data.message);
        await loadCurrentStatus();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Beenden der Pause');
    }
    setLoading(false);
  };

  const isWorking = currentStatus?.is_working || false;
  const isOnBreak = currentStatus?.break_status === 'on_break';

  return (
    <div className="arbeitszeit-timer">
      {/* Aktuelle Zeit */}
      <div className="current-time-section">
        <div className="time-label">Aktuelle Zeit</div>
        <div className="time-value">{currentTime.toLocaleTimeString('de-DE')}</div>
      </div>

      {/* Arbeitszeit Timer */}
      {isWorking && (
        <div className="work-timer-section">
          <div className="timer-label">Arbeitszeit</div>
          <div className="timer-value">{formatDuration(getCurrentWorkTime())}</div>
        </div>
      )}

      {/* Pausen Timer */}
      {isOnBreak && (
        <div className="break-timer-section">
          <div className="timer-label">Pause</div>
          <div className="timer-value break">{formatDuration(getCurrentBreakTime())}</div>
        </div>
      )}

      {/* Kontroll-Buttons */}
      <div className="timer-controls">
        {/* Einstempeln/Ausstempeln */}
        <div className="main-control">
          {!isWorking ? (
            <button 
              onClick={handleClockIn} 
              disabled={loading}
              className="timer-btn start"
              title="Einstempeln"
            >
              {loading ? 'Lade...' : 'Einstempeln'}
            </button>
          ) : (
            <button 
              onClick={handleClockOut} 
              disabled={loading}
              className="timer-btn stop"
              title="Ausstempeln"
            >
              {loading ? 'Lade...' : 'Ausstempeln'}
            </button>
          )}
        </div>

        {/* Pausen-Kontrollen */}
        {isWorking && (
          <div className="break-controls">
            {!isOnBreak ? (
              <button 
                onClick={handleStartBreak} 
                disabled={loading}
                className="timer-btn break-start"
                title="Pause starten"
              >
                {loading ? 'Lade...' : 'Pause'}
              </button>
            ) : (
              <button 
                onClick={handleEndBreak} 
                disabled={loading}
                className="timer-btn break-end"
                title="Pause beenden"
              >
                {loading ? 'Lade...' : 'Weiter'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status-Anzeige */}
      <div className="status-display">
        <div className={`status-badge ${isWorking ? 'working' : 'idle'}`}>
          {isWorking ? (isOnBreak ? 'Pause' : 'Arbeit') : 'Bereit'}
        </div>
      </div>

      {/* Nachrichten */}
      {message && (
        <div className={`message ${message.includes('Fehler') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ArbeitszeitTimer; 