import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Auftraege.css';

// API Base URL - Production vs Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

const Auftraege = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Filter-States
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    orderType: 'all',
    dateRange: 'all'
  });

  // Formular-State
  const [formData, setFormData] = useState({
    title: '',
    customer: '',
    order_type: 'maintenance',
    priority: 'normal',
    description: '',
    location: '',
    start_date: '',
    due_date: '',
    estimated_hours: 0,
    materials_needed: '',
    notes: ''
  });

  // Statistiken
  const [stats, setStats] = useState({
    totalOrders: 0,
    openOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    urgentOrders: 0,
    todayOrders: 0,
    weekOrders: 0
  });

  // Lade Daten beim Start
  useEffect(() => {
    loadOrders();
    loadStats();
  }, [filters, loadOrders, loadStats]);

  /**
   * Lädt Aufträge vom Server
   */
  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/orders`, {
        withCredentials: true
      });
      if (response.data.success) {
        let orders = response.data.orders || [];
        
        // Filtere Aufträge basierend auf den Filtern
        orders = filterOrders(orders);
        
        setOrders(orders);
      }
    } catch (error) {
      setMessage('Fehler beim Laden der Aufträge');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lädt Statistiken vom Server
   */
  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/order-stats`, {
        withCredentials: true
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
      setStats({
        totalOrders: 15,
        openOrders: 8,
        inProgressOrders: 4,
        completedOrders: 3,
        urgentOrders: 2,
        todayOrders: 3,
        weekOrders: 12
      });
    }
  };

  /**
   * Filtert Aufträge basierend auf den aktuellen Filtern
   */
  const filterOrders = (orders) => {
    let filtered = orders;

    // Status-Filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Prioritäts-Filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }

    // Auftrags-Typ-Filter
    if (filters.orderType !== 'all') {
      filtered = filtered.filter(order => order.order_type === filters.orderType);
    }

    // Datum-Filter
    if (filters.dateRange !== 'all') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.start_date);
            return orderDate >= startOfDay;
          });
          break;
        case 'week':
          const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.start_date);
            return orderDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.start_date);
            return orderDate >= monthAgo;
          });
          break;
        default:
          break;
      }
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
      title: '',
      customer: '',
      order_type: 'maintenance',
      priority: 'normal',
      description: '',
      location: '',
      start_date: '',
      due_date: '',
      estimated_hours: 0,
      materials_needed: '',
      notes: ''
    });
    setEditingOrder(null);
    setShowForm(false);
  };

  /**
   * Validiert das Formular
   */
  const validateForm = () => {
    if (!formData.title || !formData.customer) {
      setMessage('Titel und Kunde sind erforderlich');
      return false;
    }

    if (formData.start_date && formData.due_date) {
      const startDate = new Date(formData.start_date);
      const dueDate = new Date(formData.due_date);
      
      if (startDate > dueDate) {
        setMessage('Fertigstellungsdatum muss nach Startdatum liegen');
        return false;
      }
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
      if (editingOrder) {
        // Update existing order
        response = await axios.put(
          `${API_BASE_URL}/api/monteur/orders/${editingOrder.id}`,
          formData,
          { withCredentials: true }
        );
      } else {
        // Create new order
        response = await axios.post(
          `${API_BASE_URL}/api/monteur/orders`,
          formData,
          { withCredentials: true }
        );
      }

      if (response.data.success) {
        setMessage(editingOrder ? 'Auftrag erfolgreich aktualisiert!' : 'Auftrag erfolgreich erstellt!');
        resetForm();
        loadOrders();
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
   * Handler für Bearbeiten eines Auftrags
   */
  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      title: order.title || '',
      customer: order.customer || '',
      order_type: order.order_type || 'maintenance',
      priority: order.priority || 'normal',
      description: order.description || '',
      location: order.location || '',
      start_date: order.start_date || '',
      due_date: order.due_date || '',
      estimated_hours: order.estimated_hours || 0,
      materials_needed: order.materials_needed || '',
      notes: order.notes || ''
    });
    setShowForm(true);
  };

  /**
   * Handler für Löschen eines Auftrags
   */
  const handleDelete = async (orderId) => {
    if (!window.confirm('Möchten Sie diesen Auftrag wirklich löschen?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/monteur/orders/${orderId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setMessage('Auftrag erfolgreich gelöscht!');
        loadOrders();
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
   * Handler für Status-Änderung
   */
  const handleStatusChange = async (orderId, newStatus) => {
    setLoading(true);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/monteur/orders/${orderId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setMessage('Auftragsstatus erfolgreich aktualisiert!');
        loadOrders();
        loadStats();
      } else {
        setMessage('Fehler beim Aktualisieren des Status: ' + (response.data.message || 'Unbekannter Fehler'));
      }
    } catch (error) {
      setMessage('Fehler beim Aktualisieren des Status: ' + (error.response?.data?.message || error.message));
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
   * Berechnet die verbleibenden Tage bis zum Fälligkeitsdatum
   */
  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  /**
   * Gibt den Auftrags-Typ-Label zurück
   */
  const getOrderTypeLabel = (type) => {
    const typeLabels = {
      'maintenance': 'Wartung',
      'repair': 'Reparatur',
      'installation': 'Installation',
      'inspection': 'Prüfung',
      'emergency': 'Notfall',
      'upgrade': 'Upgrade'
    };
    return typeLabels[type] || type;
  };

  /**
   * Gibt den Status-Label zurück
   */
  const getStatusLabel = (status) => {
    const statusLabels = {
      'open': 'Offen',
      'assigned': 'Zugewiesen',
      'in_progress': 'In Bearbeitung',
      'completed': 'Abgeschlossen',
      'cancelled': 'Storniert'
    };
    return statusLabels[status] || status;
  };

  /**
   * Gibt die Status-Farbe zurück
   */
  const getStatusColor = (status) => {
    const colors = {
      'open': '#6b7280',
      'assigned': '#3b82f6',
      'in_progress': '#f59e0b',
      'completed': '#16a34a',
      'cancelled': '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  /**
   * Gibt die Prioritäts-Farbe zurück
   */
  const getPriorityColor = (priority) => {
    const colors = {
      'low': '#16a34a',
      'normal': '#3b82f6',
      'high': '#f59e0b',
      'urgent': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  return (
    <div className="auftraege-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Aufträge</h1>
          <p>Verwalten Sie Ihre Aufträge und deren Status</p>
        </div>
        <button 
          className="btn btn-primary btn-large"
          onClick={() => setShowForm(true)}
        >
          <span className="btn-icon">+</span>
          Neuer Auftrag
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
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalOrders}</div>
              <div className="stat-label">Gesamt Aufträge</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.openOrders}</div>
              <div className="stat-label">Offene Aufträge</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <div className="stat-value">{stats.inProgressOrders}</div>
              <div className="stat-label">In Bearbeitung</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completedOrders}</div>
              <div className="stat-label">Abgeschlossen</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <div className="stat-value">{stats.urgentOrders}</div>
              <div className="stat-label">Dringend</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.todayOrders}</div>
              <div className="stat-label">Heute</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <h3>Filter</h3>
        <div className="filter-grid">
          <div className="filter-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">Alle Status</option>
              <option value="open">Offen</option>
              <option value="assigned">Zugewiesen</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="priority">Priorität</label>
            <select
              id="priority"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="filter-select"
            >
              <option value="all">Alle Prioritäten</option>
              <option value="low">Niedrig</option>
              <option value="normal">Normal</option>
              <option value="high">Hoch</option>
              <option value="urgent">Dringend</option>
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
              <option value="upgrade">Upgrade</option>
            </select>
          </div>

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
        </div>
      </div>

      {/* Eingabeformular */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h2>{editingOrder ? 'Auftrag bearbeiten' : 'Neuer Auftrag'}</h2>
              <button 
                className="close-btn"
                onClick={resetForm}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="order-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="title">Titel *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="z.B. Wartung Aufzug Hauptstraße 15"
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="customer">Kunde *</label>
                  <input
                    type="text"
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    placeholder="Kundenname"
                    required
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="order_type">Auftragstyp *</label>
                  <select
                    id="order_type"
                    name="order_type"
                    value={formData.order_type}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  >
                    <option value="maintenance">Wartung</option>
                    <option value="repair">Reparatur</option>
                    <option value="installation">Installation</option>
                    <option value="inspection">Prüfung</option>
                    <option value="emergency">Notfall</option>
                    <option value="upgrade">Upgrade</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="priority">Priorität *</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  >
                    <option value="low">Niedrig</option>
                    <option value="normal">Normal</option>
                    <option value="high">Hoch</option>
                    <option value="urgent">Dringend</option>
                  </select>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="start_date">Startdatum</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="due_date">Fertigstellungsdatum</label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="estimated_hours">Geschätzte Stunden</label>
                  <input
                    type="number"
                    id="estimated_hours"
                    name="estimated_hours"
                    value={formData.estimated_hours}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
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
                <label htmlFor="description">Beschreibung</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detaillierte Beschreibung des Auftrags..."
                  className="form-input"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="materials_needed">Benötigte Materialien</label>
                <textarea
                  id="materials_needed"
                  name="materials_needed"
                  value={formData.materials_needed}
                  onChange={handleInputChange}
                  placeholder="Liste der benötigten Materialien..."
                  className="form-input"
                  rows="2"
                />
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
                  {loading ? 'Speichere...' : (editingOrder ? 'Aktualisieren' : 'Erstellen')}
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

      {/* Aufträge Liste */}
      <div className="orders-section">
        <div className="section-header">
          <h2>Aufträge</h2>
          <div className="section-actions">
            <span className="orders-count">{orders.length} Aufträge</span>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Lade Aufträge...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Keine Aufträge</h3>
            <p>Erstellen Sie Ihren ersten Auftrag</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Ersten Auftrag erstellen
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const daysUntilDue = getDaysUntilDue(order.due_date);
              const isOverdue = daysUntilDue && daysUntilDue < 0;
              const isDueSoon = daysUntilDue && daysUntilDue <= 3 && daysUntilDue >= 0;
              
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-title">
                      <h3>{order.title}</h3>
                      <div className="order-customer">{order.customer}</div>
                    </div>
                    <div className="order-badges">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(order.priority) }}
                      >
                        {order.priority.toUpperCase()}
                      </span>
                      {isOverdue && (
                        <span className="overdue-badge">ÜBERFÄLLIG</span>
                      )}
                      {isDueSoon && !isOverdue && (
                        <span className="due-soon-badge">FÄLLT BALD</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="order-content">
                    <div className="order-info">
                      <div className="info-item">
                        <span className="info-label">Typ:</span>
                        <span className="info-value">{getOrderTypeLabel(order.order_type)}</span>
                      </div>
                      
                      {order.location && (
                        <div className="info-item">
                          <span className="info-label">Standort:</span>
                          <span className="info-value">{order.location}</span>
                        </div>
                      )}
                      
                      {order.start_date && (
                        <div className="info-item">
                          <span className="info-label">Start:</span>
                          <span className="info-value">{formatDate(order.start_date)}</span>
                        </div>
                      )}
                      
                      {order.due_date && (
                        <div className="info-item">
                          <span className="info-label">Fertigstellung:</span>
                          <span className={`info-value ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
                            {formatDate(order.due_date)}
                            {daysUntilDue !== null && (
                              <span className="days-remaining">
                                ({daysUntilDue > 0 ? `+${daysUntilDue}` : daysUntilDue} Tage)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      
                      {order.estimated_hours > 0 && (
                        <div className="info-item">
                          <span className="info-label">Geschätzte Stunden:</span>
                          <span className="info-value">{order.estimated_hours}h</span>
                        </div>
                      )}
                    </div>
                    
                    {order.description && (
                      <div className="order-description">
                        <span className="description-label">Beschreibung:</span>
                        <span className="description-value">{order.description}</span>
                      </div>
                    )}
                    
                    {order.materials_needed && (
                      <div className="order-materials">
                        <span className="materials-label">Materialien:</span>
                        <span className="materials-value">{order.materials_needed}</span>
                      </div>
                    )}
                    
                    {order.notes && (
                      <div className="order-notes">
                        <span className="notes-label">Notizen:</span>
                        <span className="notes-value">{order.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-actions">
                    <div className="status-actions">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="status-select"
                        disabled={loading}
                      >
                        <option value="open">Offen</option>
                        <option value="assigned">Zugewiesen</option>
                        <option value="in_progress">In Bearbeitung</option>
                        <option value="completed">Abgeschlossen</option>
                        <option value="cancelled">Storniert</option>
                      </select>
                    </div>
                    
                    <div className="action-buttons">
                      <button 
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEdit(order)}
                      >
                        Bearbeiten
                      </button>
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(order.id)}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auftraege;

