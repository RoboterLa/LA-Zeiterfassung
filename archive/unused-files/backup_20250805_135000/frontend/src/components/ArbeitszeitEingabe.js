import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ArbeitszeitEingabe.css';

const ArbeitszeitEingabe = ({ onTimeEntrySaved, currentStatus }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWorking, setIsWorking] = useState(false);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [manualEntry, setManualEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    breakTime: '',
    hours: '',
    note: '',
    entryType: 'fullDay',
    workType: 'regular'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Zeit-Optionen für Dropdowns
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  const breakOptions = [
    { value: 0, label: 'Keine Pause' },
    { value: 15, label: '15 Minuten' },
    { value: 30, label: '30 Minuten' },
    { value: 45, label: '45 Minuten' },
    { value: 60, label: '1 Stunde' },
    { value: 90, label: '1,5 Stunden' }
  ];

  const workTypeOptions = [
    { value: 'regular', label: 'Reguläre Arbeit', icon: '🏢', description: 'Normale Arbeitszeit' },
    { value: 'overtime', label: 'Überstunden', icon: '⏰', description: 'Zusätzliche Arbeitszeit' },
    { value: 'sick', label: 'Krankheit', icon: '🏥', description: 'Krankheitsbedingte Abwesenheit' },
    { value: 'vacation', label: 'Urlaub', icon: '🏖️', description: 'Urlaubszeit' },
    { value: 'training', label: 'Schulung', icon: '📚', description: 'Fortbildung/Schulung' },
    { value: 'travel', label: 'Dienstreise', icon: '🚗', description: 'Reisezeit' },
    { value: 'other', label: 'Sonstiges', icon: '📝', description: 'Andere Tätigkeiten' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentStatus?.is_working) {
      setIsWorking(true);
      if (currentStatus.current_entry?.clock_in) {
        const startTime = new Date();
        startTime.setHours(...currentStatus.current_entry.clock_in.split(':'));
        setWorkStartTime(startTime);
      }
    } else {
      setIsWorking(false);
      setWorkStartTime(null);
    }
  }, [currentStatus]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getCurrentWorkTime = () => {
    if (!workStartTime) return 0;
    return Math.floor((currentTime - workStartTime) / 1000);
  };

  const handleClockIn = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post('http://localhost:8080/api/monteur/clock-in');
      if (response.data.success) {
        setMessage(response.data.message);
        setIsWorking(true);
        setWorkStartTime(new Date());
        if (onTimeEntrySaved) onTimeEntrySaved();
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
        setIsWorking(false);
        setWorkStartTime(null);
        if (onTimeEntrySaved) onTimeEntrySaved();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Ausstempeln');
    }
    setLoading(false);
  };

  const handleManualSave = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const entryData = {
        date: manualEntry.date,
        note: manualEntry.note,
        entry_type: manualEntry.entryType,
        work_type: manualEntry.workType
      };

      if (manualEntry.entryType === 'fullDay') {
        if (!manualEntry.startTime || !manualEntry.endTime) {
          setMessage('Bitte Start- und Endzeit eingeben');
          setLoading(false);
          return;
        }
        entryData.start_time = manualEntry.startTime;
        entryData.end_time = manualEntry.endTime;
        entryData.break_time = manualEntry.breakTime;
      } else {
        if (!manualEntry.hours) {
          setMessage('Bitte Stundenanzahl eingeben');
          setLoading(false);
          return;
        }
        entryData.hours = parseFloat(manualEntry.hours);
      }

      const response = await axios.post('http://localhost:8080/api/monteur/manual-entry', entryData);
      
      if (response.data.success) {
        setMessage('Zeiteintrag erfolgreich gespeichert');
        setManualEntry({
          date: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: '',
          breakTime: '',
          hours: '',
          note: '',
          entryType: 'fullDay',
          workType: 'regular'
        });
        if (onTimeEntrySaved) onTimeEntrySaved();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Speichern des Zeiteintrags');
    }
    
    setLoading(false);
  };

  const isToday = manualEntry.date === new Date().toISOString().split('T')[0];

  return (
    <div className="arbeitszeit-eingabe-compact">
      {/* Live Timer Section */}
      <div className="timer-section-compact">
        <div className="current-time-display">
          <div className="time-label">Aktuelle Zeit</div>
          <div className="time-value">{currentTime.toLocaleTimeString('de-DE')}</div>
        </div>
        
        {isWorking && (
          <div className="work-timer-compact">
            <div className="timer-label">Arbeitszeit</div>
            <div className="timer-value">{formatDuration(getCurrentWorkTime())}</div>
          </div>
        )}
        
        <div className="timer-controls-compact">
          {!isWorking ? (
            <button 
              onClick={handleClockIn} 
              disabled={loading}
              className="timer-btn-compact start"
            >
              {loading ? 'Lade...' : 'Einstempeln'}
            </button>
          ) : (
            <button 
              onClick={handleClockOut} 
              disabled={loading}
              className="timer-btn-compact stop"
            >
              {loading ? 'Lade...' : 'Ausstempeln'}
            </button>
          )}
        </div>
      </div>

      {/* Manual Entry Section */}
      <div className="manual-entry-compact">
        <div className="entry-header">
          <h3>Manuelle Zeiteingabe</h3>
          <div className="entry-type-toggle-compact">
            <label>
              <input
                type="radio"
                value="fullDay"
                checked={manualEntry.entryType === 'fullDay'}
                onChange={(e) => setManualEntry({...manualEntry, entryType: e.target.value})}
              />
              Ganzer Tag
            </label>
            <label>
              <input
                type="radio"
                value="hoursOnly"
                checked={manualEntry.entryType === 'hoursOnly'}
                onChange={(e) => setManualEntry({...manualEntry, entryType: e.target.value})}
              />
              Nur Stunden
            </label>
          </div>
        </div>

        <div className="entry-form-compact">
          <div className="form-row-compact">
            <label>Datum:</label>
            <input
              type="date"
              value={manualEntry.date}
              onChange={(e) => setManualEntry({...manualEntry, date: e.target.value})}
            />
          </div>

          {/* Arbeitszeit-Typ Auswahl */}
          <div className="work-type-section">
            <label>Arbeitszeit-Typ:</label>
            <div className="work-type-grid">
              {workTypeOptions.map(option => (
                <label key={option.value} className="work-type-option">
                  <input
                    type="radio"
                    value={option.value}
                    checked={manualEntry.workType === option.value}
                    onChange={(e) => setManualEntry({...manualEntry, workType: e.target.value})}
                  />
                  <div className="work-type-content">
                    <span className="work-type-icon">{option.icon}</span>
                    <div className="work-type-text">
                      <div className="work-type-label">{option.label}</div>
                      <div className="work-type-description">{option.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {manualEntry.entryType === 'fullDay' ? (
            <div className="time-inputs-compact">
              <div className="time-input-group">
                <label>Startzeit:</label>
                <select
                  value={manualEntry.startTime}
                  onChange={(e) => setManualEntry({...manualEntry, startTime: e.target.value})}
                >
                  <option value="">Bitte wählen</option>
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div className="time-input-group">
                <label>Endzeit:</label>
                <select
                  value={manualEntry.endTime}
                  onChange={(e) => setManualEntry({...manualEntry, endTime: e.target.value})}
                >
                  <option value="">Bitte wählen</option>
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div className="time-input-group">
                <label>Pause:</label>
                <select
                  value={manualEntry.breakTime}
                  onChange={(e) => setManualEntry({...manualEntry, breakTime: e.target.value})}
                >
                  {breakOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="hours-input-compact">
              <label>Stunden:</label>
              <select
                value={manualEntry.hours}
                onChange={(e) => setManualEntry({...manualEntry, hours: e.target.value})}
              >
                <option value="">Bitte wählen</option>
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(hour => (
                  <option key={hour} value={hour}>{hour}h</option>
                ))}
              </select>
            </div>
          )}

          <div className="note-input-compact">
            <label>Notiz:</label>
            <textarea
              value={manualEntry.note}
              onChange={(e) => setManualEntry({...manualEntry, note: e.target.value})}
              placeholder="Optional: Notiz zum Tag..."
              rows="2"
            />
          </div>

          <div className="form-actions-compact">
            <button 
              onClick={handleManualSave}
              disabled={loading}
              className="save-btn-compact"
            >
              {loading ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </div>

        {!isToday && (
          <div className="approval-notice-compact">
            ⚠️ Einträge für vergangene Tage müssen zur Prüfung freigegeben werden.
          </div>
        )}
      </div>

      {message && (
        <div className={`message-compact ${message.includes('Fehler') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ArbeitszeitEingabe; 