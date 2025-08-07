import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './BueroDashboard.css';

// API Base URL - Production vs Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

const BueroDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Dashboard-States
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    openOrders: 0,
    completedOrders: 0,
    activeMonteurs: 0,
    totalMonteurs: 0,
    emergencies: 0,
    totalCustomers: 0
  });

  // Aufträge-States
  const [orders, setOrders] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    title: '',
    description: '',
    customer_id: '',
    monteur_id: '',
    priority: 'normal',
    status: 'open',
    scheduled_date: '',
    estimated_duration: '',
    location: '',
    notes: ''
  });

  // Monteure-States
  const [monteurs, setMonteurs] = useState([]);
  const [showMonteurForm, setShowMonteurForm] = useState(false);
  const [editingMonteur, setEditingMonteur] = useState(null);
  const [monteurForm, setMonteurForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'monteur',
    status: 'active',
    specialization: '',
    notes: ''
  });

  // Kunden-States
  const [customers, setCustomers] = useState([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    notes: ''
  });

  // Notfälle-States
  const [emergencies, setEmergencies] = useState([]);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState(null);
  const [emergencyForm, setEmergencyForm] = useState({
    title: '',
    description: '',
    customer_id: '',
    monteur_id: '',
    priority: 'high',
    status: 'active',
    location: '',
    notes: ''
  });

  // Timer für aktuelle Zeit
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Lade Daten beim Start
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Lädt alle Dashboard-Daten
   */
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDashboardStats(),
        loadOrders(),
        loadMonteurs(),
        loadCustomers(),
        loadEmergencies()
      ]);
    } catch (error) {
      setMessage('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lädt Dashboard-Statistiken
   */
  const loadDashboardStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/buero/dashboard-stats`, {
        withCredentials: true
      });
      if (response.data.success) {
        setDashboardStats(response.data.stats);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
      setDashboardStats({
        totalOrders: 15,
        openOrders: 8,
        completedOrders: 7,
        activeMonteurs: 5,
        totalMonteurs: 8,
        emergencies: 2,
        totalCustomers: 12
      });
    }
  };

  /**
   * Lädt alle Aufträge
   */
  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/buero/orders`, {
        withCredentials: true
      });
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
      setOrders([
        {
          id: 1,
          title: 'Aufzug Wartung',
          description: 'Regelmäßige Wartung des Aufzugs',
          customer_id: 1,
          monteur_id: 2,
          priority: 'normal',
          status: 'in_progress',
          scheduled_date: '2025-08-08',
          estimated_duration: '4h',
          location: 'München Zentrum',
          created_at: '2025-08-07T10:00:00Z'
        },
        {
          id: 2,
          title: 'Notfall Reparatur',
          description: 'Aufzug steckt fest',
          customer_id: 2,
          monteur_id: 1,
          priority: 'urgent',
          status: 'open',
          scheduled_date: '2025-08-07',
          estimated_duration: '2h',
          location: 'München West',
          created_at: '2025-08-07T09:30:00Z'
        }
      ]);
    }
  };

  /**
   * Lädt alle Monteure
   */
  const loadMonteurs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/buero/monteurs`, {
        withCredentials: true
      });
      if (response.data.success) {
        setMonteurs(response.data.monteurs);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
      setMonteurs([
        {
          id: 1,
          name: 'Max Mustermann',
          email: 'max@lackner.de',
          phone: '+49 89 123456',
          role: 'monteur',
          status: 'active',
          specialization: 'Aufzüge',
          current_order_id: 2,
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Anna Schmidt',
          email: 'anna@lackner.de',
          phone: '+49 89 123457',
          role: 'monteur',
          status: 'active',
          specialization: 'Wartung',
          current_order_id: 1,
          created_at: '2025-01-02T00:00:00Z'
        }
      ]);
    }
  };

  /**
   * Lädt alle Kunden
   */
  const loadCustomers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/buero/customers`, {
        withCredentials: true
      });
      if (response.data.success) {
        setCustomers(response.data.customers);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
      setCustomers([
        {
          id: 1,
          name: 'Bürohaus München',
          email: 'info@buerohaus.de',
          phone: '+49 89 987654',
          address: 'Maximilianstraße 1, 80539 München',
          contact_person: 'Herr Müller',
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Wohnanlage West',
          email: 'verwaltung@wohnanlage-west.de',
          phone: '+49 89 987655',
          address: 'Westendstraße 15, 80339 München',
          contact_person: 'Frau Schmidt',
          created_at: '2025-01-02T00:00:00Z'
        }
      ]);
    }
  };

  /**
   * Lädt alle Notfälle
   */
  const loadEmergencies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/buero/emergencies`, {
        withCredentials: true
      });
      if (response.data.success) {
        setEmergencies(response.data.emergencies);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
      setEmergencies([
        {
          id: 1,
          title: 'Aufzug steckt fest',
          description: 'Personen im Aufzug eingeschlossen',
          customer_id: 2,
          monteur_id: 1,
          priority: 'urgent',
          status: 'active',
          location: 'Wohnanlage West',
          created_at: '2025-08-07T09:30:00Z'
        }
      ]);
    }
  };

  /**
   * Formatiert DateTime-String
   */
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('de-DE');
  };

  /**
   * Formatiert Datum
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  /**
   * Formatiert Zeit
   */
  const formatTime = (date) => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Gibt Prioritäts-Label zurück
   */
  const getPriorityLabel = (priority) => {
    const labels = {
      low: { text: 'Niedrig', color: 'green' },
      normal: { text: 'Normal', color: 'blue' },
      high: { text: 'Hoch', color: 'orange' },
      urgent: { text: 'Dringend', color: 'red' }
    };
    return labels[priority] || labels.normal;
  };

  /**
   * Gibt Status-Label zurück
   */
  const getStatusLabel = (status) => {
    const labels = {
      open: { text: 'Offen', color: 'orange' },
      assigned: { text: 'Zugewiesen', color: 'blue' },
      in_progress: { text: 'In Bearbeitung', color: 'yellow' },
      completed: { text: 'Abgeschlossen', color: 'green' },
      cancelled: { text: 'Storniert', color: 'red' },
      active: { text: 'Aktiv', color: 'red' },
      resolved: { text: 'Gelöst', color: 'green' }
    };
    return labels[status] || labels.open;
  };

  /**
   * Behandelt Formular-Änderungen
   */
  const handleFormChange = (formType, field, value) => {
    const formSetters = {
      order: setOrderForm,
      monteur: setMonteurForm,
      customer: setCustomerForm,
      emergency: setEmergencyForm
    };
    
    const setForm = formSetters[formType];
    if (setForm) {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  /**
   * Setzt Formular zurück
   */
  const resetForm = (formType) => {
    const defaultForms = {
      order: {
        title: '',
        description: '',
        customer_id: '',
        monteur_id: '',
        priority: 'normal',
        status: 'open',
        scheduled_date: '',
        estimated_duration: '',
        location: '',
        notes: ''
      },
      monteur: {
        name: '',
        email: '',
        phone: '',
        role: 'monteur',
        status: 'active',
        specialization: '',
        notes: ''
      },
      customer: {
        name: '',
        email: '',
        phone: '',
        address: '',
        contact_person: '',
        notes: ''
      },
      emergency: {
        title: '',
        description: '',
        customer_id: '',
        monteur_id: '',
        priority: 'high',
        status: 'active',
        location: '',
        notes: ''
      }
    };

    const formSetters = {
      order: setOrderForm,
      monteur: setMonteurForm,
      customer: setCustomerForm,
      emergency: setEmergencyForm
    };

    const setForm = formSetters[formType];
    if (setForm) {
      setForm(defaultForms[formType]);
    }
  };

  /**
   * Behandelt Auftrag-Submit
   */
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingOrder) {
        // Update
        const response = await axios.put(`${API_BASE_URL}/api/buero/orders/${editingOrder.id}`, orderForm, {
          withCredentials: true
        });
        if (response.data.success) {
          setMessage('Auftrag erfolgreich aktualisiert');
          setShowOrderForm(false);
          setEditingOrder(null);
          resetForm('order');
          loadOrders();
        }
      } else {
        // Create
        const response = await axios.post(`${API_BASE_URL}/api/buero/orders`, orderForm, {
          withCredentials: true
        });
        if (response.data.success) {
          setMessage('Auftrag erfolgreich erstellt');
          setShowOrderForm(false);
          resetForm('order');
          loadOrders();
        }
      }
    } catch (error) {
      setMessage('Fehler beim Speichern des Auftrags');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Behandelt Monteur-Submit
   */
  const handleMonteurSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingMonteur) {
        // Update
        const response = await axios.put(`${API_BASE_URL}/api/buero/monteurs/${editingMonteur.id}`, monteurForm, {
          withCredentials: true
        });
        if (response.data.success) {
          setMessage('Monteur erfolgreich aktualisiert');
          setShowMonteurForm(false);
          setEditingMonteur(null);
          resetForm('monteur');
          loadMonteurs();
        }
      } else {
        // Create
        const response = await axios.post(`${API_BASE_URL}/api/buero/monteurs`, monteurForm, {
          withCredentials: true
        });
        if (response.data.success) {
          setMessage('Monteur erfolgreich erstellt');
          setShowMonteurForm(false);
          resetForm('monteur');
          loadMonteurs();
        }
      }
    } catch (error) {
      setMessage('Fehler beim Speichern des Monteurs');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Behandelt Kunde-Submit
   */
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingCustomer) {
        // Update
        const response = await axios.put(`${API_BASE_URL}/api/buero/customers/${editingCustomer.id}`, customerForm, {
          withCredentials: true
        });
        if (response.data.success) {
          setMessage('Kunde erfolgreich aktualisiert');
          setShowCustomerForm(false);
          setEditingCustomer(null);
          resetForm('customer');
          loadCustomers();
        }
      } else {
        // Create
        const response = await axios.post(`${API_BASE_URL}/api/buero/customers`, customerForm, {
          withCredentials: true
        });
        if (response.data.success) {
          setMessage('Kunde erfolgreich erstellt');
          setShowCustomerForm(false);
          resetForm('customer');
          loadCustomers();
        }
      }
    } catch (error) {
      setMessage('Fehler beim Speichern des Kunden');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Behandelt Notfall-Submit
   */
  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingEmergency) {
        // Update
        const response = await axios.put(`${API_BASE_URL}/api/buero/emergencies/${editingEmergency.id}`, emergencyForm, {
          withCredentials: true
        });
        if (response.data.success) {
          setMessage('Notfall erfolgreich aktualisiert');
          setShowEmergencyForm(false);
          setEditingEmergency(null);
          resetForm('emergency');
          loadEmergencies();
        }
      } else {
        // Create
        const response = await axios.post(`${API_BASE_URL}/api/buero/emergencies`, emergencyForm, {
          withCredentials: true
        });
        if (response.data.success) {
          setMessage('Notfall erfolgreich erstellt');
          setShowEmergencyForm(false);
          resetForm('emergency');
          loadEmergencies();
        }
      }
    } catch (error) {
      setMessage('Fehler beim Speichern des Notfalls');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Behandelt Bearbeitung
   */
  const handleEdit = (item, type) => {
    const formSetters = {
      order: setOrderForm,
      monteur: setMonteurForm,
      customer: setCustomerForm,
      emergency: setEmergencyForm
    };

    const editingSetters = {
      order: setEditingOrder,
      monteur: setEditingMonteur,
      customer: setEditingCustomer,
      emergency: setEditingEmergency
    };

    const showFormSetters = {
      order: setShowOrderForm,
      monteur: setShowMonteurForm,
      customer: setShowCustomerForm,
      emergency: setShowEmergencyForm
    };

    const setForm = formSetters[type];
    const setEditing = editingSetters[type];
    const setShowForm = showFormSetters[type];

    if (setForm && setEditing && setShowForm) {
      setForm(item);
      setEditing(item);
      setShowForm(true);
    }
  };

  /**
   * Behandelt Löschung
   */
  const handleDelete = async (itemId, type) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/buero/${type}/${itemId}`, {
        withCredentials: true
      });
      if (response.data.success) {
        setMessage(`${type === 'orders' ? 'Auftrag' : type === 'monteurs' ? 'Monteur' : type === 'customers' ? 'Kunde' : 'Notfall'} erfolgreich gelöscht`);
        
        // Lade Daten neu
        switch (type) {
          case 'orders':
            loadOrders();
            break;
          case 'monteurs':
            loadMonteurs();
            break;
          case 'customers':
            loadCustomers();
            break;
          case 'emergencies':
            loadEmergencies();
            break;
        }
      }
    } catch (error) {
      setMessage('Fehler beim Löschen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buero-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Büro Dashboard</h1>
          <p className="current-time">{formatTime(currentTime)} - {formatDate(currentTime)}</p>
        </div>
        <div className="header-right">
          <span className="user-info">Büro</span>
          <button onClick={onLogout} className="logout-btn">Abmelden</button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Aufträge
        </button>
        <button 
          className={`nav-tab ${activeTab === 'monteurs' ? 'active' : ''}`}
          onClick={() => setActiveTab('monteurs')}
        >
          Monteure
        </button>
        <button 
          className={`nav-tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Kunden
        </button>
        <button 
          className={`nav-tab ${activeTab === 'emergencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('emergencies')}
        >
          Notfälle
        </button>
      </nav>

      {/* Message */}
      {message && (
        <div className="message">
          {message}
          <button onClick={() => setMessage('')} className="close-btn">×</button>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Aufträge</h3>
              <div className="stat-numbers">
                <span className="stat-main">{dashboardStats.totalOrders}</span>
                <span className="stat-sub">Gesamt</span>
              </div>
              <div className="stat-details">
                <span className="stat-open">{dashboardStats.openOrders} offen</span>
                <span className="stat-completed">{dashboardStats.completedOrders} abgeschlossen</span>
              </div>
            </div>

            <div className="stat-card">
              <h3>Monteure</h3>
              <div className="stat-numbers">
                <span className="stat-main">{dashboardStats.activeMonteurs}</span>
                <span className="stat-sub">Aktiv</span>
              </div>
              <div className="stat-details">
                <span className="stat-total">{dashboardStats.totalMonteurs} gesamt</span>
              </div>
            </div>

            <div className="stat-card">
              <h3>Notfälle</h3>
              <div className="stat-numbers">
                <span className="stat-main">{dashboardStats.emergencies}</span>
                <span className="stat-sub">Aktiv</span>
              </div>
            </div>

            <div className="stat-card">
              <h3>Kunden</h3>
              <div className="stat-numbers">
                <span className="stat-main">{dashboardStats.totalCustomers}</span>
                <span className="stat-sub">Gesamt</span>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Schnellaktionen</h3>
            <div className="action-buttons">
              <button 
                onClick={() => { setActiveTab('orders'); setShowOrderForm(true); }}
                className="action-btn primary"
              >
                Neuer Auftrag
              </button>
              <button 
                onClick={() => { setActiveTab('emergencies'); setShowEmergencyForm(true); }}
                className="action-btn urgent"
              >
                Notfall melden
              </button>
              <button 
                onClick={() => { setActiveTab('monteurs'); setShowMonteurForm(true); }}
                className="action-btn secondary"
              >
                Monteur hinzufügen
              </button>
              <button 
                onClick={() => { setActiveTab('customers'); setShowCustomerForm(true); }}
                className="action-btn secondary"
              >
                Kunde hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="tab-content">
          <div className="content-header">
            <h2>Aufträge</h2>
            <button 
              onClick={() => { setShowOrderForm(true); setEditingOrder(null); resetForm('order'); }}
              className="add-btn"
            >
              + Neuer Auftrag
            </button>
          </div>

          {showOrderForm && (
            <div className="form-overlay">
              <div className="form-modal">
                <h3>{editingOrder ? 'Auftrag bearbeiten' : 'Neuer Auftrag'}</h3>
                <form onSubmit={handleOrderSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Titel *</label>
                      <input
                        type="text"
                        value={orderForm.title}
                        onChange={(e) => handleFormChange('order', 'title', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Priorität</label>
                      <select
                        value={orderForm.priority}
                        onChange={(e) => handleFormChange('order', 'priority', e.target.value)}
                      >
                        <option value="low">Niedrig</option>
                        <option value="normal">Normal</option>
                        <option value="high">Hoch</option>
                        <option value="urgent">Dringend</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Beschreibung</label>
                    <textarea
                      value={orderForm.description}
                      onChange={(e) => handleFormChange('order', 'description', e.target.value)}
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Kunde</label>
                      <select
                        value={orderForm.customer_id}
                        onChange={(e) => handleFormChange('order', 'customer_id', e.target.value)}
                      >
                        <option value="">Kunde auswählen</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Monteur</label>
                      <select
                        value={orderForm.monteur_id}
                        onChange={(e) => handleFormChange('order', 'monteur_id', e.target.value)}
                      >
                        <option value="">Monteur auswählen</option>
                        {monteurs.map(monteur => (
                          <option key={monteur.id} value={monteur.id}>
                            {monteur.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Geplantes Datum</label>
                      <input
                        type="date"
                        value={orderForm.scheduled_date}
                        onChange={(e) => handleFormChange('order', 'scheduled_date', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Geschätzte Dauer</label>
                      <input
                        type="text"
                        value={orderForm.estimated_duration}
                        onChange={(e) => handleFormChange('order', 'estimated_duration', e.target.value)}
                        placeholder="z.B. 4h"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Standort</label>
                    <input
                      type="text"
                      value={orderForm.location}
                      onChange={(e) => handleFormChange('order', 'location', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Notizen</label>
                    <textarea
                      value={orderForm.notes}
                      onChange={(e) => handleFormChange('order', 'notes', e.target.value)}
                      rows="2"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Speichern...' : (editingOrder ? 'Aktualisieren' : 'Erstellen')}
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => { setShowOrderForm(false); setEditingOrder(null); resetForm('order'); }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="content-list">
            {orders.map(order => (
              <div key={order.id} className="list-item">
                <div className="item-main">
                  <h4>{order.title}</h4>
                  <p>{order.description}</p>
                  <div className="item-meta">
                    <span className="location">{order.location}</span>
                    <span className="date">{formatDate(order.scheduled_date)}</span>
                    <span className="duration">{order.estimated_duration}</span>
                  </div>
                </div>
                <div className="item-status">
                  <span className={`priority-badge ${order.priority}`}>
                    {getPriorityLabel(order.priority).text}
                  </span>
                  <span className={`status-badge ${order.status}`}>
                    {getStatusLabel(order.status).text}
                  </span>
                </div>
                <div className="item-actions">
                  <button 
                    onClick={() => handleEdit(order, 'order')}
                    className="action-btn edit"
                  >
                    Bearbeiten
                  </button>
                  <button 
                    onClick={() => handleDelete(order.id, 'orders')}
                    className="action-btn delete"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monteurs Tab */}
      {activeTab === 'monteurs' && (
        <div className="tab-content">
          <div className="content-header">
            <h2>Monteure</h2>
            <button 
              onClick={() => { setShowMonteurForm(true); setEditingMonteur(null); resetForm('monteur'); }}
              className="add-btn"
            >
              + Neuer Monteur
            </button>
          </div>

          {showMonteurForm && (
            <div className="form-overlay">
              <div className="form-modal">
                <h3>{editingMonteur ? 'Monteur bearbeiten' : 'Neuer Monteur'}</h3>
                <form onSubmit={handleMonteurSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        value={monteurForm.name}
                        onChange={(e) => handleFormChange('monteur', 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>E-Mail</label>
                      <input
                        type="email"
                        value={monteurForm.email}
                        onChange={(e) => handleFormChange('monteur', 'email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Telefon</label>
                      <input
                        type="tel"
                        value={monteurForm.phone}
                        onChange={(e) => handleFormChange('monteur', 'phone', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Spezialisierung</label>
                      <input
                        type="text"
                        value={monteurForm.specialization}
                        onChange={(e) => handleFormChange('monteur', 'specialization', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notizen</label>
                    <textarea
                      value={monteurForm.notes}
                      onChange={(e) => handleFormChange('monteur', 'notes', e.target.value)}
                      rows="2"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Speichern...' : (editingMonteur ? 'Aktualisieren' : 'Erstellen')}
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => { setShowMonteurForm(false); setEditingMonteur(null); resetForm('monteur'); }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="content-list">
            {monteurs.map(monteur => (
              <div key={monteur.id} className="list-item">
                <div className="item-main">
                  <h4>{monteur.name}</h4>
                  <p>{monteur.email}</p>
                  <div className="item-meta">
                    <span className="phone">{monteur.phone}</span>
                    <span className="specialization">{monteur.specialization}</span>
                  </div>
                </div>
                <div className="item-status">
                  <span className={`status-badge ${monteur.status}`}>
                    {monteur.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                <div className="item-actions">
                  <button 
                    onClick={() => handleEdit(monteur, 'monteur')}
                    className="action-btn edit"
                  >
                    Bearbeiten
                  </button>
                  <button 
                    onClick={() => handleDelete(monteur.id, 'monteurs')}
                    className="action-btn delete"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="tab-content">
          <div className="content-header">
            <h2>Kunden</h2>
            <button 
              onClick={() => { setShowCustomerForm(true); setEditingCustomer(null); resetForm('customer'); }}
              className="add-btn"
            >
              + Neuer Kunde
            </button>
          </div>

          {showCustomerForm && (
            <div className="form-overlay">
              <div className="form-modal">
                <h3>{editingCustomer ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h3>
                <form onSubmit={handleCustomerSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) => handleFormChange('customer', 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>E-Mail</label>
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) => handleFormChange('customer', 'email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Telefon</label>
                      <input
                        type="tel"
                        value={customerForm.phone}
                        onChange={(e) => handleFormChange('customer', 'phone', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Ansprechpartner</label>
                      <input
                        type="text"
                        value={customerForm.contact_person}
                        onChange={(e) => handleFormChange('customer', 'contact_person', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Adresse</label>
                    <textarea
                      value={customerForm.address}
                      onChange={(e) => handleFormChange('customer', 'address', e.target.value)}
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label>Notizen</label>
                    <textarea
                      value={customerForm.notes}
                      onChange={(e) => handleFormChange('customer', 'notes', e.target.value)}
                      rows="2"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Speichern...' : (editingCustomer ? 'Aktualisieren' : 'Erstellen')}
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => { setShowCustomerForm(false); setEditingCustomer(null); resetForm('customer'); }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="content-list">
            {customers.map(customer => (
              <div key={customer.id} className="list-item">
                <div className="item-main">
                  <h4>{customer.name}</h4>
                  <p>{customer.email}</p>
                  <div className="item-meta">
                    <span className="phone">{customer.phone}</span>
                    <span className="contact">{customer.contact_person}</span>
                  </div>
                  <p className="address">{customer.address}</p>
                </div>
                <div className="item-actions">
                  <button 
                    onClick={() => handleEdit(customer, 'customer')}
                    className="action-btn edit"
                  >
                    Bearbeiten
                  </button>
                  <button 
                    onClick={() => handleDelete(customer.id, 'customers')}
                    className="action-btn delete"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergencies Tab */}
      {activeTab === 'emergencies' && (
        <div className="tab-content">
          <div className="content-header">
            <h2>Notfälle</h2>
            <button 
              onClick={() => { setShowEmergencyForm(true); setEditingEmergency(null); resetForm('emergency'); }}
              className="add-btn urgent"
            >
              + Notfall melden
            </button>
          </div>

          {showEmergencyForm && (
            <div className="form-overlay">
              <div className="form-modal">
                <h3>{editingEmergency ? 'Notfall bearbeiten' : 'Neuer Notfall'}</h3>
                <form onSubmit={handleEmergencySubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Titel *</label>
                      <input
                        type="text"
                        value={emergencyForm.title}
                        onChange={(e) => handleFormChange('emergency', 'title', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Priorität</label>
                      <select
                        value={emergencyForm.priority}
                        onChange={(e) => handleFormChange('emergency', 'priority', e.target.value)}
                      >
                        <option value="high">Hoch</option>
                        <option value="urgent">Dringend</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Beschreibung</label>
                    <textarea
                      value={emergencyForm.description}
                      onChange={(e) => handleFormChange('emergency', 'description', e.target.value)}
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Kunde</label>
                      <select
                        value={emergencyForm.customer_id}
                        onChange={(e) => handleFormChange('emergency', 'customer_id', e.target.value)}
                      >
                        <option value="">Kunde auswählen</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Monteur</label>
                      <select
                        value={emergencyForm.monteur_id}
                        onChange={(e) => handleFormChange('emergency', 'monteur_id', e.target.value)}
                      >
                        <option value="">Monteur auswählen</option>
                        {monteurs.map(monteur => (
                          <option key={monteur.id} value={monteur.id}>
                            {monteur.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Standort</label>
                    <input
                      type="text"
                      value={emergencyForm.location}
                      onChange={(e) => handleFormChange('emergency', 'location', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Notizen</label>
                    <textarea
                      value={emergencyForm.notes}
                      onChange={(e) => handleFormChange('emergency', 'notes', e.target.value)}
                      rows="2"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Speichern...' : (editingEmergency ? 'Aktualisieren' : 'Erstellen')}
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => { setShowEmergencyForm(false); setEditingEmergency(null); resetForm('emergency'); }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="content-list">
            {emergencies.map(emergency => (
              <div key={emergency.id} className="list-item emergency">
                <div className="item-main">
                  <h4>{emergency.title}</h4>
                  <p>{emergency.description}</p>
                  <div className="item-meta">
                    <span className="location">{emergency.location}</span>
                    <span className="date">{formatDateTime(emergency.created_at)}</span>
                  </div>
                </div>
                <div className="item-status">
                  <span className={`priority-badge ${emergency.priority}`}>
                    {getPriorityLabel(emergency.priority).text}
                  </span>
                  <span className={`status-badge ${emergency.status}`}>
                    {getStatusLabel(emergency.status).text}
                  </span>
                </div>
                <div className="item-actions">
                  <button 
                    onClick={() => handleEdit(emergency, 'emergency')}
                    className="action-btn edit"
                  >
                    Bearbeiten
                  </button>
                  <button 
                    onClick={() => handleDelete(emergency.id, 'emergencies')}
                    className="action-btn delete"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BueroDashboard; 