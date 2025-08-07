import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ZeiterfassungEingabe.css';

// API Base URL - Production vs Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

const ZeiterfassungEingabe = ({ user }) => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Filter-States
  const [filters, setFilters] = useState({
    dateRange: 'today',
    orderType: 'all',
    status: 'all',
    customer: 'all'
  });

  // Formular-State
  const [formData, setFormData] = useState({
    order_id: '',
    start_time: '',
    end_time: '',
    description: '',
    work_type: 'maintenance',
    location: '',
    materials_used: '',
    customer_feedback: ''
  });

  // Lade Daten beim Start
  useEffect(() => {
    loadTimeEntries();
    loadOrders();
  }, [filters, loadTimeEntries, loadOrders]);

  /**
   * Lädt Zeiteinträge vom Server
   */
  const loadTimeEntries = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/time-entries`, {
        withCredentials: true
      });
      if (response.data.success) {
        let entries = response.data.entries || [];
        
        // Filtere Einträge basierend auf den Filtern
        entries = filterEntries(entries);
        
        setTimeEntries(entries);
      }
    } catch (error) {
      setMessage('Fehler beim Laden der Zeiteinträge');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lädt Aufträge vom Server
   */
  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/orders`);
      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
      setOrders([
        { id: 1, title: 'Wartung Aufzug Hauptstraße 15', customer: 'Gebäudeverwaltung München', order_type: 'maintenance' },
        { id: 2, title: 'Reparatur Aufzug Marienplatz', customer: 'Stadt München', order_type: 'repair' },
        { id: 3, title: 'Installation Neuer Aufzug', customer: 'Bauprojekt GmbH', order_type: 'installation' }
      ]);
    }
  };

  /**
   * Filtert Zeiteinträge basierend auf den aktuellen Filtern
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
            const entryDate = new Date(entry.start_time);
            return entryDate >= startOfDay;
          });
          break;
        case 'week':
          const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(entry => {
            const entryDate = new Date(entry.start_time);
            return entryDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          filtered = filtered.filter(entry => {
            const entryDate = new Date(entry.start_time);
            return entryDate >= monthAgo;
          });
          break;
        default:
          break;
      }
    }

    // Auftrags-Typ-Filter
    if (filters.orderType !== 'all') {
      filtered = filtered.filter(entry => entry.work_type === filters.orderType);
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      order_id: '',
      start_time: '',
      end_time: '',
      description: '',
      work_type: 'maintenance',
      location: '',
      materials_used: '',
      customer_feedback: ''
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  /**
   * Handler für Formular-Submit (Erstellen/Bearbeiten)
   */
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
        setMessage(editingEntry ? 'Zeiteintrag erfolgreich aktualisiert!' : 'Zeiteintrag erfolgreich erstellt!');
        resetForm();
        loadTimeEntries();
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
      order_id: entry.order_id || '',
      start_time: entry.start_time ? entry.start_time.substring(0, 16) : '',
      end_time: entry.end_time ? entry.end_time.substring(0, 16) : '',
      description: entry.description || '',
      work_type: entry.work_type || 'maintenance',
      location: entry.location || '',
      materials_used: entry.materials_used || '',
      customer_feedback: entry.customer_feedback || ''
    });
    setShowForm(true);
  };

  /**
   * Handler für Löschen eines Eintrags
   */
  const handleDelete = async (entryId) => {
    if (!window.confirm('Möchten Sie diesen Zeiteintrag wirklich löschen?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/monteur/time-entries/${entryId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setMessage('Zeiteintrag erfolgreich gelöscht!');
        loadTimeEntries();
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
   * Formatiert DateTime-String zu deutscher Lokalisierung
   */
  // const formatDateTime = (dateTimeString) => {
  //   if (!dateTimeString) return '-';
  //   const date = new Date(dateTimeString);
  //   return date.toLocaleString('de-DE');
  // };

  /**
   * Formatiert DateTime-String zu Datum
   */
  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('de-DE');
  };

  /**
   * Formatiert DateTime-String zu Zeit
   */
  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Berechnet die Dauer zwischen Start- und Endzeit
   */
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}min`;
  };

  /**
   * Berechnet die Gesamtstunden aller Einträge
   */
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

  /**
   * Gibt den Auftragstitel basierend auf der Auftrags-ID zurück
   */
  const getOrderTitle = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    return order ? order.title : `Auftrag ${orderId}`;
  };

  /**
   * Gibt den Auftragstyp-Label zurück
   */
  const getWorkTypeLabel = (type) => {
    const typeLabels = {
      'maintenance': 'Wartung',
      'repair': 'Reparatur',
      'installation': 'Installation',
      'inspection': 'Prüfung',
      'emergency': 'Notfall'
    };
    return typeLabels[type] || type;
  };

  return (
    <div className="zeiterfassung-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Zeiterfassungen (Kundenarbeiten)</h1>
          <p>Erfassen und verwalten Sie Ihre Arbeitszeiten für Kundenaufträge</p>
        </div>
        <button 
          className="btn btn-primary btn-large"
          onClick={() => setShowForm(true)}
        >
          <span className="btn-icon">+</span>
          Neuer Zeiteintrag
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.includes('Fehler') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

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
            <label htmlFor="orderType">Auftragstyp</label>
            <select
              id="orderType"
              value={filters.orderType}
              onChange={(e) => handleFilterChange('orderType', e.target.value)}
              className="filter-select"
            >
              <option value="all">Alle Typen</option>
              <option value="maintenance">Wartung</option>
              <option value="repair">Reparatur</option>
              <option value="installation">Installation</option>
              <option value="inspection">Prüfung</option>
              <option value="emergency">Notfall</option>
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

      {/* Statistics */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{timeEntries.length}</div>
              <div className="stat-label">Zeiteinträge</div>
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
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{orders.length}</div>
              <div className="stat-label">Aufträge</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{(getTotalHours() * 45).toFixed(0)}€</div>
              <div className="stat-label">Geschätzter Wert</div>
            </div>
          </div>
        </div>
      </div>

      {/* Eingabeformular */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h2>{editingEntry ? 'Zeiteintrag bearbeiten' : 'Neuer Zeiteintrag'}</h2>
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
                  <label htmlFor="order_id">Auftrag *</label>
                  <select
                    id="order_id"
                    name="order_id"
                    value={formData.order_id}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  >
                    <option value="">Auftrag auswählen...</option>
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        {order.title} - {order.customer}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="work_type">Arbeitstyp *</label>
                  <select
                    id="work_type"
                    name="work_type"
                    value={formData.work_type}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  >
                    <option value="maintenance">Wartung</option>
                    <option value="repair">Reparatur</option>
                    <option value="installation">Installation</option>
                    <option value="inspection">Prüfung</option>
                    <option value="emergency">Notfall</option>
                  </select>
                </div>
              </div>
              
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
                <label htmlFor="location">Standort</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="z.B. Marienplatz 1, München"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Beschreibung *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Was wurde gemacht? Welche Arbeiten wurden durchgeführt?"
                  className="form-input"
                  rows="3"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="materials_used">Verwendete Materialien</label>
                <textarea
                  id="materials_used"
                  name="materials_used"
                  value={formData.materials_used}
                  onChange={handleInputChange}
                  placeholder="Liste der verwendeten Materialien..."
                  className="form-input"
                  rows="2"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="customer_feedback">Kunden-Feedback</label>
                <textarea
                  id="customer_feedback"
                  name="customer_feedback"
                  value={formData.customer_feedback}
                  onChange={handleInputChange}
                  placeholder="Feedback vom Kunden..."
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
            <p>Erstellen Sie Ihren ersten Zeiteintrag für Kundenarbeiten</p>
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
                  <div className="entry-order">
                    <span className="order-label">Auftrag:</span>
                    <span className="order-value">{getOrderTitle(entry.order_id)}</span>
                  </div>
                  
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
                  
                  <div className="entry-details">
                    <div className="detail-item">
                      <span className="detail-label">Arbeitstyp:</span>
                      <span className="detail-value">{getWorkTypeLabel(entry.work_type)}</span>
                    </div>
                    
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
                    
                    {entry.materials_used && (
                      <div className="detail-item">
                        <span className="detail-label">Materialien:</span>
                        <span className="detail-value">{entry.materials_used}</span>
                      </div>
                    )}
                    
                    {entry.customer_feedback && (
                      <div className="detail-item">
                        <span className="detail-label">Kunden-Feedback:</span>
                        <span className="detail-value">{entry.customer_feedback}</span>
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

export default ZeiterfassungEingabe;
