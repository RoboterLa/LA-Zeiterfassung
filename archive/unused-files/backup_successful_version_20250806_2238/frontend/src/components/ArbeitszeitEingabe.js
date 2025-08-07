import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ArbeitszeitEingabe.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

const ArbeitszeitEingabe = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Formular-State
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    description: '',
    order_id: ''
  });

  // Lade Zeiteinträge beim Start
  useEffect(() => {
    loadTimeEntries();
  }, []);

  const loadTimeEntries = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/time-entries`, {
        withCredentials: true
      });
      if (response.data.success) {
        setTimeEntries(response.data.entries || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Zeiteinträge:', error);
      setMessage('Fehler beim Laden der Zeiteinträge');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      start_time: '',
      end_time: '',
      description: '',
      order_id: ''
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let response;
      if (editingEntry) {
        // Update existing entry
        response = await axios.put(
          `${API_BASE_URL}/api/monteur/time-entries/${editingEntry.id}`,
          formData,
          { withCredentials: true }
        );
      } else {
        // Create new entry
        response = await axios.post(
          `${API_BASE_URL}/api/monteur/time-entries`,
          formData,
          { withCredentials: true }
        );
      }

      if (response.data.success) {
        setMessage(editingEntry ? 'Eintrag erfolgreich aktualisiert!' : 'Eintrag erfolgreich erstellt!');
        resetForm();
        loadTimeEntries();
      } else {
        setMessage('Fehler: ' + (response.data.message || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setMessage('Fehler beim Speichern: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      start_time: entry.start_time ? entry.start_time.substring(0, 16) : '',
      end_time: entry.end_time ? entry.end_time.substring(0, 16) : '',
      description: entry.description || '',
      order_id: entry.order_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/monteur/time-entries/${entryId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setMessage('Eintrag erfolgreich gelöscht!');
        loadTimeEntries();
      } else {
        setMessage('Fehler beim Löschen: ' + (response.data.message || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      setMessage('Fehler beim Löschen: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('de-DE');
  };

  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('de-DE');
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}min`;
  };

  const getTotalHours = () => {
    return timeEntries.reduce((total, entry) => {
      if (entry.start_time && entry.end_time) {
        const start = new Date(entry.start_time);
        const end = new Date(entry.end_time);
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);
        return total + diffHours;
      }
      return total;
    }, 0);
  };

  return (
    <div className="arbeitszeit-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Arbeitszeit Erfassung</h1>
          <p>Verwalten Sie Ihre Arbeitszeiten und Zeiteinträge</p>
        </div>
        <button 
          className="btn btn-primary btn-large"
          onClick={() => setShowForm(true)}
        >
          <span className="btn-icon">+</span>
          Neuer Eintrag
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.includes('Fehler') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Eingabeformular */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h2>{editingEntry ? 'Eintrag bearbeiten' : 'Neuer Zeiteintrag'}</h2>
              <button 
                className="close-btn"
                onClick={resetForm}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="time-entry-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="start_time">Startzeit *</label>
                  <input
                    type="datetime-local"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="end_time">Endzeit</label>
                  <input
                    type="datetime-local"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Beschreibung</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Was wurde gemacht?"
                  className="form-input"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="order_id">Auftragsnummer</label>
                <input
                  type="text"
                  id="order_id"
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleInputChange}
                  placeholder="z.B. AUF-001"
                  className="form-input"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Speichere...' : (editingEntry ? 'Aktualisieren' : 'Erstellen')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistiken */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{timeEntries.length}</div>
              <div className="stat-label">Einträge</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{getTotalHours().toFixed(1)}h</div>
              <div className="stat-label">Gesamtstunden</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{new Date().toLocaleDateString('de-DE')}</div>
              <div className="stat-label">Heute</div>
            </div>
          </div>
        </div>
      </div>

      {/* Zeiteinträge Liste */}
      <div className="entries-section">
        <div className="section-header">
          <h2>Zeiteinträge</h2>
          <div className="section-actions">
            <span className="entries-count">{timeEntries.length} Einträge</span>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Lade Zeiteinträge...</p>
          </div>
        ) : timeEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>Keine Zeiteinträge</h3>
            <p>Erstellen Sie Ihren ersten Zeiteintrag</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Ersten Eintrag erstellen
            </button>
          </div>
        ) : (
          <div className="entries-list">
            {timeEntries.map((entry) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-header">
                  <div className="entry-date">
                    <span className="date-label">Datum</span>
                    <span className="date-value">{formatDate(entry.start_time)}</span>
                  </div>
                  <div className="entry-actions">
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={() => handleEdit(entry)}
                    >
                      Bearbeiten
                    </button>
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
                
                <div className="entry-content">
                  <div className="entry-times">
                    <div className="time-item">
                      <span className="time-label">Start:</span>
                      <span className="time-value">{formatTime(entry.start_time)}</span>
                    </div>
                    <div className="time-item">
                      <span className="time-label">Ende:</span>
                      <span className="time-value">{formatTime(entry.end_time)}</span>
                    </div>
                    <div className="time-item">
                      <span className="time-label">Dauer:</span>
                      <span className="time-value duration">{calculateDuration(entry.start_time, entry.end_time)}</span>
                    </div>
                  </div>
                  
                  {entry.description && (
                    <div className="entry-description">
                      <span className="description-label">Beschreibung:</span>
                      <span className="description-value">{entry.description}</span>
                    </div>
                  )}
                  
                  {entry.order_id && (
                    <div className="entry-order">
                      <span className="order-label">Auftrag:</span>
                      <span className="order-value">{entry.order_id}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArbeitszeitEingabe; 