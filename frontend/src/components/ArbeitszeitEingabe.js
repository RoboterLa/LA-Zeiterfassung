import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ArbeitszeitEingabe.css';

// API Base URL - Production vs Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

const ArbeitszeitEingabe = ({ user }) => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Filter-States
  const [filters, setFilters] = useState({
    dateRange: 'today',
    workType: 'all',
    status: 'all'
  });

  // Formular-State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    break_duration: 0,
    work_type: 'regular',
    description: '',
    location: '',
    overtime_hours: 0,
    meal_allowance: false,
    notes: '',
    // Neue Felder für Urlaub/Krankmeldung
    leave_type: '',
    leave_reason: '',
    sick_note: false,
    approval_status: 'pending'
  });

  // Neue States für erweiterte Funktionen
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showSickForm, setShowSickForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    leave_type: 'vacation',
    reason: '',
    approval_status: 'pending'
  });

  const [sickForm, setSickForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
    doctor_note: false,
    approval_status: 'pending'
  });

  // Statistiken
  const [stats, setStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    overtime: 0,
    vacationDays: 25,
    sickDays: 0,
    mealAllowance: 0
  });

  // Lade Daten beim Start
  useEffect(() => {
    loadTimeEntries();
    loadStats();
  }, [filters, loadTimeEntries, loadStats]);

  /**
   * Lädt Arbeitszeiteinträge vom Server
   */
  const loadTimeEntries = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/work-time-entries`, {
        withCredentials: true
      });
      if (response.data.success) {
        let entries = response.data.entries || [];
        
        // Filtere Einträge basierend auf den Filtern
        entries = filterEntries(entries);
        
        setTimeEntries(entries);
      }
    } catch (error) {
      setMessage('Fehler beim Laden der Arbeitszeiteinträge');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lädt Statistiken vom Server
   */
  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/work-stats`, {
        withCredentials: true
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
      setStats({
        todayHours: 6.5,
        weekHours: 32.5,
        monthHours: 140.0,
        overtime: 2.5,
        vacationDays: 25,
        sickDays: 0,
        mealAllowance: 3
      });
    }
  };

  /**
   * Filtert Einträge basierend auf den aktuellen Filtern
   */
  const filterEntries = (entries) => {
    let filtered = entries;

    // Datum-Filter
    if (filters.dateRange !== 'all') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startOfDay;
          });
          break;
        case 'week':
          const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          filtered = filtered.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= monthAgo;
          });
          break;
        default:
          break;
      }
    }

    // Arbeitszeit-Typ-Filter
    if (filters.workType !== 'all') {
      filtered = filtered.filter(entry => entry.work_type === filters.workType);
    }

    // Status-Filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    return filtered;
  };

  /**
   * Handler für Eingabe-Änderungen im Formular
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Handler für Filter-Änderungen
   */
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  /**
   * Setzt das Formular zurück
   */
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      break_duration: 0,
      work_type: 'regular',
      description: '',
      location: '',
      overtime_hours: 0,
      meal_allowance: false,
      notes: '',
      // Neue Felder für Urlaub/Krankmeldung
      leave_type: '',
      leave_reason: '',
      sick_note: false,
      approval_status: 'pending'
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  /**
   * Validiert das Formular
   */
  const validateForm = () => {
    if (!formData.start_time || !formData.end_time) {
      setMessage('Start- und Endzeit sind erforderlich');
      return false;
    }

    const startTime = new Date(`2000-01-01T${formData.start_time}`);
    const endTime = new Date(`2000-01-01T${formData.end_time}`);
    
    if (startTime >= endTime) {
      setMessage('Endzeit muss nach Startzeit liegen');
      return false;
    }

    // Berechne Arbeitszeit
    const workDuration = (endTime - startTime) / (1000 * 60 * 60); // Stunden
    const netWorkHours = workDuration - (formData.break_duration / 60);
    
    if (netWorkHours > 10) {
      setMessage('Arbeitszeit über 10h ist gesetzlich verboten');
      return false;
    } else if (netWorkHours > 8.5) {
      setMessage('Arbeitszeit über 8,5h erfordert Überstundenantrag');
      return false;
    } else if (netWorkHours > 6 && formData.break_duration < 30) {
      setMessage('Bei über 6h Arbeit ist mindestens 30min Pause erforderlich');
      return false;
    }

    return true;
  };

  /**
   * Handler für Formular-Submit (Erstellen/Bearbeiten)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      let response;
      if (editingEntry) {
        // Update existing entry
        response = await axios.put(
          `${API_BASE_URL}/api/monteur/work-time-entries/${editingEntry.id}`,
          formData,
          { withCredentials: true }
        );
      } else {
        // Create new entry
        response = await axios.post(
          `${API_BASE_URL}/api/monteur/work-time-entries`,
          formData,
          { withCredentials: true }
        );
      }

      if (response.data.success) {
        setMessage(editingEntry ? 'Arbeitszeiteintrag erfolgreich aktualisiert!' : 'Arbeitszeiteintrag erfolgreich erstellt!');
        resetForm();
        loadTimeEntries();
        loadStats();
      } else {
        setMessage('Fehler: ' + (response.data.message || 'Unbekannter Fehler'));
      }
    } catch (error) {
      setMessage('Fehler beim Speichern: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler für Bearbeiten eines Eintrags
   */
  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date || new Date().toISOString().split('T')[0],
      start_time: entry.start_time || '',
      end_time: entry.end_time || '',
      break_duration: entry.break_duration || 0,
      work_type: entry.work_type || 'regular',
      description: entry.description || '',
      location: entry.location || '',
      overtime_hours: entry.overtime_hours || 0,
      meal_allowance: entry.meal_allowance || false,
      notes: entry.notes || '',
      // Neue Felder für Urlaub/Krankmeldung
      leave_type: entry.leave_type || '',
      leave_reason: entry.leave_reason || '',
      sick_note: entry.sick_note || false,
      approval_status: entry.approval_status || 'pending'
    });
    setShowForm(true);
  };

  /**
   * Handler für Löschen eines Eintrags
   */
  const handleDelete = async (entryId) => {
    if (!window.confirm('Möchten Sie diesen Arbeitszeiteintrag wirklich löschen?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/monteur/work-time-entries/${entryId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setMessage('Arbeitszeiteintrag erfolgreich gelöscht!');
        loadTimeEntries();
        loadStats();
      } else {
        setMessage('Fehler beim Löschen: ' + (response.data.message || 'Unbekannter Fehler'));
      }
    } catch (error) {
      setMessage('Fehler beim Löschen: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatiert DateTime-String zu Datum
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  /**
   * Formatiert DateTime-String zu Zeit
   */
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  /**
   * Berechnet die Dauer zwischen Start- und Endzeit
   */
  const calculateDuration = (startTime, endTime, breakDuration = 0) => {
    if (!startTime || !endTime) return '-';
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const netHours = diffHours + (diffMinutes / 60) - (breakDuration / 60);
    return `${netHours.toFixed(1)}h`;
  };

  /**
   * Gibt den Arbeitszeit-Typ-Label zurück
   */
  const getWorkTypeLabel = (type) => {
    const typeLabels = {
      'regular': 'Reguläre Arbeit',
      'overtime': 'Überstunden',
      'sick': 'Krankheit',
      'vacation': 'Urlaub',
      'training': 'Schulung',
      'travel': 'Dienstreise',
      'other': 'Sonstiges'
    };
    return typeLabels[type] || type;
  };

  /**
   * Gibt die Icon-Farbe für den Arbeitszeit-Typ zurück
   */
  const getWorkTypeColor = (type) => {
    const colors = {
      'regular': '#16a34a',
      'overtime': '#f59e0b',
      'sick': '#dc2626',
      'vacation': '#3b82f6',
      'training': '#8b5cf6',
      'travel': '#06b6d4',
      'other': '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  /**
   * Berechnet die Gesamtstunden aller Einträge
   */
  const getTotalHours = () => {
    return timeEntries.reduce((total, entry) => {
      if (entry.start_time && entry.end_time) {
        const start = new Date(`2000-01-01T${entry.start_time}`);
        const end = new Date(`2000-01-01T${entry.end_time}`);
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);
        const netHours = diffHours - (entry.break_duration / 60);
        return total + netHours;
      }
      return total;
    }, 0);
  };

  /**
   * Behandelt Urlaub-Submit
   */
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/leave-requests`, leaveForm, {
        withCredentials: true
      });
      if (response.data.success) {
        setMessage('Urlaub erfolgreich gemeldet');
        setShowLeaveForm(false);
        setLeaveForm({
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          leave_type: 'vacation',
          reason: '',
          approval_status: 'pending'
        });
        loadTimeEntries();
        loadStats();
      }
    } catch (error) {
      setMessage('Fehler beim Melden des Urlaubs');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Behandelt Krankmeldung-Submit
   */
  const handleSickSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/sick-requests`, sickForm, {
        withCredentials: true
      });
      if (response.data.success) {
        setMessage('Krankmeldung erfolgreich eingereicht');
        setShowSickForm(false);
        setSickForm({
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          reason: '',
          doctor_note: false,
          approval_status: 'pending'
        });
        loadTimeEntries();
        loadStats();
      }
    } catch (error) {
      setMessage('Fehler beim Einreichen der Krankmeldung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="arbeitszeit-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Arbeitszeit (Personalzeiterfassung)</h1>
          <p>Erfassen und verwalten Sie Ihre persönlichen Arbeitszeiten</p>
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

      {/* Statistics */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.todayHours}h</div>
              <div className="stat-label">Heute gearbeitet</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.weekHours}h</div>
              <div className="stat-label">Diese Woche</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overtime}h</div>
              <div className="stat-label">Überstunden</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏖️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.vacationDays}</div>
              <div className="stat-label">Urlaubstage</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.sickDays}</div>
              <div className="stat-label">Krankheitstage</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🍽️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.mealAllowance}</div>
              <div className="stat-label">Verpflegungsmehraufwand</div>
            </div>
          </div>
        </div>
      </div>

      {/* Schnellaktionen */}
      <div className="quick-actions-section">
        <h3>Schnellaktionen</h3>
        <div className="quick-actions-grid">
          <button 
            onClick={() => setShowForm(true)}
            className="quick-action-btn primary"
          >
            <span className="action-icon">+</span>
            <span className="action-label">Manueller Eintrag</span>
          </button>
          <button 
            onClick={() => {/* TODO: Einstempeln */}}
            className="quick-action-btn secondary"
          >
            <span className="action-icon">⏰</span>
            <span className="action-label">Einstempeln</span>
          </button>
          <button 
            onClick={() => {/* TODO: Ausstempeln */}}
            className="quick-action-btn secondary"
          >
            <span className="action-icon">⏹️</span>
            <span className="action-label">Ausstempeln</span>
          </button>
          <button 
            onClick={() => setShowLeaveForm(true)}
            className="quick-action-btn vacation"
          >
            <span className="action-icon">🏖️</span>
            <span className="action-label">Urlaub melden</span>
          </button>
          <button 
            onClick={() => setShowSickForm(true)}
            className="quick-action-btn sick"
          >
            <span className="action-icon">🏥</span>
            <span className="action-label">Krankmeldung</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <h3>Filter</h3>
        <div className="filter-grid">
          <div className="filter-group">
            <label htmlFor="dateRange">Zeitraum</label>
            <select
              id="dateRange"
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="filter-select"
            >
              <option value="all">Alle Zeiträume</option>
              <option value="today">Heute</option>
              <option value="week">Diese Woche</option>
              <option value="month">Dieser Monat</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="workType">Arbeitszeit-Typ</label>
            <select
              id="workType"
              value={filters.workType}
              onChange={(e) => handleFilterChange('workType', e.target.value)}
              className="filter-select"
            >
              <option value="all">Alle Typen</option>
              <option value="regular">Reguläre Arbeit</option>
              <option value="overtime">Überstunden</option>
              <option value="sick">Krankheit</option>
              <option value="vacation">Urlaub</option>
              <option value="training">Schulung</option>
              <option value="travel">Dienstreise</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="completed">Abgeschlossen</option>
              <option value="pending">Ausstehend</option>
            </select>
          </div>
        </div>
      </div>

      {/* Eingabeformular */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h2>{editingEntry ? 'Arbeitszeiteintrag bearbeiten' : 'Neuer Arbeitszeiteintrag'}</h2>
              <button 
                className="close-btn"
                onClick={resetForm}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="work-time-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="date">Datum *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="work_type">Arbeitszeit-Typ *</label>
                  <select
                    id="work_type"
                    name="work_type"
                    value={formData.work_type}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  >
                    <option value="regular">Reguläre Arbeit</option>
                    <option value="overtime">Überstunden</option>
                    <option value="sick">Krankheit</option>
                    <option value="vacation">Urlaub</option>
                    <option value="training">Schulung</option>
                    <option value="travel">Dienstreise</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="start_time">Startzeit *</label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="end_time">Endzeit *</label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="break_duration">Pause (Minuten)</label>
                  <select
                    id="break_duration"
                    name="break_duration"
                    value={formData.break_duration}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="0">Keine Pause</option>
                    <option value="15">15 Minuten</option>
                    <option value="30">30 Minuten</option>
                    <option value="45">45 Minuten</option>
                    <option value="60">1 Stunde</option>
                    <option value="90">1,5 Stunden</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Standort</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="z.B. Büro, Baustelle, Kunde"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Beschreibung</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Was wurde gemacht? Welche Arbeiten wurden durchgeführt?"
                  className="form-input"
                  rows="3"
                />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="overtime_hours">Überstunden (Stunden)</label>
                  <input
                    type="number"
                    id="overtime_hours"
                    name="overtime_hours"
                    value={formData.overtime_hours}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="meal_allowance"
                      checked={formData.meal_allowance}
                      onChange={handleInputChange}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">Verpflegungsmehraufwand</span>
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notizen</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Zusätzliche Notizen..."
                  className="form-input"
                  rows="2"
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

      {/* Urlaub Formular */}
      {showLeaveForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h2>Urlaub melden</h2>
              <button 
                className="close-btn"
                onClick={() => setShowLeaveForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleLeaveSubmit} className="leave-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="leave_start_date">Startdatum *</label>
                  <input
                    type="date"
                    id="leave_start_date"
                    name="start_date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="leave_end_date">Enddatum *</label>
                  <input
                    type="date"
                    id="leave_end_date"
                    name="end_date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                    required
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="leave_type">Urlaubsart *</label>
                <select
                  id="leave_type"
                  name="leave_type"
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({...leaveForm, leave_type: e.target.value})}
                  required
                  className="form-input"
                >
                  <option value="vacation">Urlaub</option>
                  <option value="sick_leave">Krankheitsurlaub</option>
                  <option value="personal_leave">Persönliche Tage</option>
                  <option value="training">Schulung</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="leave_reason">Grund</label>
                <textarea
                  id="leave_reason"
                  name="reason"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                  placeholder="Grund für den Urlaub..."
                  className="form-input"
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Speichere...' : 'Urlaub melden'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowLeaveForm(false)}
                  disabled={loading}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Krankmeldung Formular */}
      {showSickForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h2>Krankmeldung</h2>
              <button 
                className="close-btn"
                onClick={() => setShowSickForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSickSubmit} className="sick-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="sick_start_date">Startdatum *</label>
                  <input
                    type="date"
                    id="sick_start_date"
                    name="start_date"
                    value={sickForm.start_date}
                    onChange={(e) => setSickForm({...sickForm, start_date: e.target.value})}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="sick_end_date">Enddatum *</label>
                  <input
                    type="date"
                    id="sick_end_date"
                    name="end_date"
                    value={sickForm.end_date}
                    onChange={(e) => setSickForm({...sickForm, end_date: e.target.value})}
                    required
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="sick_reason">Grund</label>
                <textarea
                  id="sick_reason"
                  name="reason"
                  value={sickForm.reason}
                  onChange={(e) => setSickForm({...sickForm, reason: e.target.value})}
                  placeholder="Grund für die Krankmeldung..."
                  className="form-input"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="doctor_note"
                    checked={sickForm.doctor_note}
                    onChange={(e) => setSickForm({...sickForm, doctor_note: e.target.checked})}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Arztbesuch geplant</span>
                </label>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Speichere...' : 'Krankmeldung einreichen'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowSickForm(false)}
                  disabled={loading}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Arbeitszeiteinträge Liste */}
      <div className="entries-section">
        <div className="section-header">
          <h2>Arbeitszeiteinträge</h2>
          <div className="section-actions">
            <span className="entries-count">{timeEntries.length} Einträge</span>
            <span className="total-hours">Gesamt: {getTotalHours().toFixed(1)}h</span>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Lade Arbeitszeiteinträge...</p>
          </div>
        ) : timeEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⏱️</div>
            <h3>Keine Arbeitszeiteinträge</h3>
            <p>Erstellen Sie Ihren ersten Arbeitszeiteintrag</p>
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
                    <span className="date-value">{formatDate(entry.date)}</span>
                  </div>
                  <div className="entry-type" style={{ color: getWorkTypeColor(entry.work_type) }}>
                    {getWorkTypeLabel(entry.work_type)}
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
                      <span className="time-value duration">{calculateDuration(entry.start_time, entry.end_time, entry.break_duration)}</span>
                    </div>
                    {entry.break_duration > 0 && (
                      <div className="time-item">
                        <span className="time-label">Pause:</span>
                        <span className="time-value break">{entry.break_duration}min</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="entry-details">
                    {entry.location && (
                      <div className="detail-item">
                        <span className="detail-label">Standort:</span>
                        <span className="detail-value">{entry.location}</span>
                      </div>
                    )}
                    
                    {entry.description && (
                      <div className="detail-item">
                        <span className="detail-label">Beschreibung:</span>
                        <span className="detail-value">{entry.description}</span>
                      </div>
                    )}
                    
                    {entry.overtime_hours > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Überstunden:</span>
                        <span className="detail-value overtime">{entry.overtime_hours}h</span>
                      </div>
                    )}
                    
                    {entry.meal_allowance && (
                      <div className="detail-item">
                        <span className="detail-label">Verpflegungsmehraufwand:</span>
                        <span className="detail-value meal">Ja</span>
                      </div>
                    )}
                    
                    {entry.notes && (
                      <div className="detail-item">
                        <span className="detail-label">Notizen:</span>
                        <span className="detail-value">{entry.notes}</span>
                      </div>
                    )}
                  </div>
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