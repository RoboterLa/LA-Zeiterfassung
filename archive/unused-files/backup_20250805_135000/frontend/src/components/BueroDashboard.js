import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BueroDashboard.css';

// API Base URL für Production/Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app.azurewebsites.net' 
  : 'http://localhost:8080';

const BueroDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [monteurs, setMonteurs] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    openOrders: 0,
    activeEmergencies: 0,
    availableMonteurs: 0
  });

  // Aktuelle Zeit aktualisieren
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Daten laden
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Echte Daten aus der Datenbank laden
      const [ordersRes, emergenciesRes, timeEntriesRes, customersRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/buero/orders`),
        axios.get(`${API_BASE_URL}/api/buero/emergencies`),
        axios.get(`${API_BASE_URL}/api/monteur/time-entries`),
        axios.get(`${API_BASE_URL}/api/buero/customers`),
        axios.get(`${API_BASE_URL}/api/buero/users`)
      ]);

      setOrders(ordersRes.data.orders || []);
      setEmergencies(emergenciesRes.data.emergencies || []);
      setTimeEntries(timeEntriesRes.data.time_entries || []);
      setCustomers(customersRes.data.customers || []);
      
      // Monteure aus Users filtern
      const monteurUsers = (usersRes.data.users || []).filter(u => u.role === 'monteur');
      setMonteurs(monteurUsers);

      // Statistiken berechnen
      setStats({
        totalOrders: ordersRes.data.orders?.length || 0,
        openOrders: ordersRes.data.orders?.filter(o => o.status !== 'completed').length || 0,
        activeEmergencies: emergenciesRes.data.emergencies?.filter(e => e.status === 'active').length || 0,
        availableMonteurs: monteurUsers.length || 0
      });

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const date = new Date(timeString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const getOrderTypeLabel = (type) => {
    const types = {
      'maintenance': 'Wartung',
      'repair': 'Reparatur',
      'installation': 'Installation',
      'inspection': 'Prüfung'
    };
    return types[type] || type;
  };

  const getPriorityLabel = (priority) => {
    const priorities = {
      'low': 'Niedrig',
      'normal': 'Normal',
      'high': 'Hoch',
      'urgent': 'Dringend'
    };
    return priorities[priority] || priority;
  };

  const getStatusLabel = (status) => {
    const statuses = {
      'new': 'Neu',
      'assigned': 'Zugewiesen',
      'in_progress': 'In Bearbeitung',
      'completed': 'Abgeschlossen',
      'pending': 'Ausstehend'
    };
    return statuses[status] || status;
  };

  const handleAssignOrder = async (orderId, monteurId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/buero/orders/${orderId}`, {
        assigned_to: monteurId,
        status: 'assigned'
      });
      loadData(); // Daten neu laden
    } catch (error) {
      console.error('Fehler beim Zuweisen des Auftrags:', error);
    }
  };

  const handleCreateOrder = async (newOrder) => {
    try {
      await axios.post(`${API_BASE_URL}/api/buero/orders`, newOrder);
      loadData(); // Daten neu laden
    } catch (error) {
      console.error('Fehler beim Erstellen des Auftrags:', error);
    }
  };

  const handleCreateEmergency = async (newEmergency) => {
    try {
      await axios.post(`${API_BASE_URL}/api/buero/emergencies`, newEmergency);
      loadData(); // Daten neu laden
    } catch (error) {
      console.error('Fehler beim Erstellen des Notfalls:', error);
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Büro Dashboard</h1>
        <div className="current-time">
          {currentTime.toLocaleTimeString('de-DE')}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Aufträge</h3>
          <div className="stat-number">{stats.totalOrders}</div>
          <div className="stat-label">Gesamt</div>
        </div>
        <div className="stat-card">
          <h3>Offene Aufträge</h3>
          <div className="stat-number">{stats.openOrders}</div>
          <div className="stat-label">Zu bearbeiten</div>
        </div>
        <div className="stat-card">
          <h3>Notfälle</h3>
          <div className="stat-number">{stats.activeEmergencies}</div>
          <div className="stat-label">Aktiv</div>
        </div>
        <div className="stat-card">
          <h3>Monteure</h3>
          <div className="stat-number">{stats.availableMonteurs}</div>
          <div className="stat-label">Verfügbar</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>🔴 Aktive Notfälle</h2>
          <div className="emergencies-list">
            {emergencies.filter(e => e.status === 'active').map(emergency => (
              <div key={emergency.id} className="emergency-card urgent">
                <div className="emergency-header">
                  <h3>{emergency.title}</h3>
                  <span className="priority-badge urgent">Dringend</span>
                </div>
                <p><strong>Ort:</strong> {emergency.location}</p>
                <p><strong>Zugewiesen:</strong> {emergency.assigned_name || 'Nicht zugewiesen'}</p>
                <p><strong>Gemeldet:</strong> {formatTime(emergency.reported_at)}</p>
              </div>
            ))}
            {emergencies.filter(e => e.status === 'active').length === 0 && (
              <p className="no-data">Keine aktiven Notfälle</p>
            )}
          </div>
        </div>

        <div className="section">
          <h2>📋 Offene Aufträge</h2>
          <div className="orders-list">
            {orders.filter(o => o.status !== 'completed').slice(0, 3).map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <h3>{order.title}</h3>
                  <span className={`status-badge ${order.status}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <p><strong>Kunde:</strong> {order.customer}</p>
                <p><strong>Ort:</strong> {order.location}</p>
                <p><strong>Zugewiesen:</strong> {order.assigned_name || 'Nicht zugewiesen'}</p>
                <p><strong>Fällig:</strong> {formatDate(order.due_date)}</p>
              </div>
            ))}
            {orders.filter(o => o.status !== 'completed').length === 0 && (
              <p className="no-data">Keine offenen Aufträge</p>
            )}
          </div>
        </div>

        <div className="section">
          <h2>👥 Monteure Status</h2>
          <div className="monteurs-list">
            {monteurs.map(monteur => (
              <div key={monteur.id} className="monteur-card">
                <div className="monteur-info">
                  <h3>{monteur.name}</h3>
                  <span className="status-indicator available">Verfügbar</span>
                </div>
                <p><strong>ID:</strong> {monteur.id}</p>
              </div>
            ))}
            {monteurs.length === 0 && (
              <p className="no-data">Keine Monteure verfügbar</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="orders-page">
      <div className="page-header">
        <h1>Aufträge verwalten</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setActiveTab('create-order')}
        >
          Neuen Auftrag erstellen
        </button>
      </div>

      <div className="orders-filters">
        <select className="filter-select">
          <option value="">Alle Status</option>
          <option value="new">Neu</option>
          <option value="assigned">Zugewiesen</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="completed">Abgeschlossen</option>
        </select>
        <select className="filter-select">
          <option value="">Alle Prioritäten</option>
          <option value="low">Niedrig</option>
          <option value="normal">Normal</option>
          <option value="high">Hoch</option>
          <option value="urgent">Dringend</option>
        </select>
      </div>

      <div className="orders-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Titel</th>
              <th>Kunde</th>
              <th>Ort</th>
              <th>Typ</th>
              <th>Priorität</th>
              <th>Status</th>
              <th>Zugewiesen</th>
              <th>Fällig</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.title}</td>
                <td>{order.customer}</td>
                <td>{order.location}</td>
                <td>{getOrderTypeLabel(order.order_type)}</td>
                <td>
                  <span className={`priority-badge ${order.priority}`}>
                    {getPriorityLabel(order.priority)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${order.status}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td>{order.assigned_name || '-'}</td>
                <td>{formatDate(order.due_date)}</td>
                <td>
                  <select 
                    onChange={(e) => handleAssignOrder(order.id, e.target.value)}
                    value={order.assigned_to || ''}
                  >
                    <option value="">Zuweisen...</option>
                    {monteurs.map(monteur => (
                      <option key={monteur.id} value={monteur.id}>
                        {monteur.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCreateOrder = () => (
    <div className="create-order-page">
      <div className="page-header">
        <h1>Neuen Auftrag erstellen</h1>
        <button 
          className="btn btn-secondary"
          onClick={() => setActiveTab('orders')}
        >
          Zurück zu Aufträgen
        </button>
      </div>

      <form className="order-form" onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        handleCreateOrder({
          title: formData.get('title'),
          description: formData.get('description'),
          customer: formData.get('customer'),
          location: formData.get('location'),
          order_type: formData.get('order_type'),
          priority: formData.get('priority'),
          assigned_to: formData.get('assigned_to') || null,
          due_date: formData.get('due_date')
        });
        setActiveTab('orders');
      }}>
        <div className="form-group">
          <label>Titel *</label>
          <input type="text" name="title" required />
        </div>
        <div className="form-group">
          <label>Beschreibung</label>
          <textarea name="description" rows="3"></textarea>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Kunde *</label>
            <input type="text" name="customer" required />
          </div>
          <div className="form-group">
            <label>Ort *</label>
            <input type="text" name="location" required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Typ *</label>
            <select name="order_type" required>
              <option value="">Bitte wählen...</option>
              <option value="maintenance">Wartung</option>
              <option value="repair">Reparatur</option>
              <option value="installation">Installation</option>
              <option value="inspection">Prüfung</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priorität *</label>
            <select name="priority" required>
              <option value="">Bitte wählen...</option>
              <option value="low">Niedrig</option>
              <option value="normal">Normal</option>
              <option value="high">Hoch</option>
              <option value="urgent">Dringend</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Zuweisen an</label>
            <select name="assigned_to">
              <option value="">Nicht zuweisen</option>
              {monteurs.map(monteur => (
                <option key={monteur.id} value={monteur.id}>
                  {monteur.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Fälligkeitsdatum *</label>
            <input type="date" name="due_date" required />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Auftrag erstellen
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => setActiveTab('orders')}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );

  const renderEmergencies = () => (
    <div className="emergencies-page">
      <div className="page-header">
        <h1>Notfälle verwalten</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setActiveTab('create-emergency')}
        >
          Notfall melden
        </button>
      </div>

      <div className="emergencies-list">
        {emergencies.map(emergency => (
          <div key={emergency.id} className="emergency-card">
            <div className="emergency-header">
              <h3>{emergency.title}</h3>
              <span className={`priority-badge ${emergency.priority}`}>
                {getPriorityLabel(emergency.priority)}
              </span>
            </div>
            <div className="emergency-details">
              <p><strong>Beschreibung:</strong> {emergency.description}</p>
              <p><strong>Ort:</strong> {emergency.location}</p>
              <p><strong>Status:</strong> 
                <span className={`status-badge ${emergency.status}`}>
                  {emergency.status === 'active' ? 'Aktiv' : 'Gelöst'}
                </span>
              </p>
              <p><strong>Zugewiesen:</strong> {emergency.assigned_name || 'Nicht zugewiesen'}</p>
              <p><strong>Gemeldet:</strong> {formatTime(emergency.reported_at)}</p>
            </div>
            <div className="emergency-actions">
              <select 
                onChange={(e) => handleAssignOrder(emergency.id, e.target.value)}
                value={emergency.assigned_to || ''}
              >
                <option value="">Zuweisen...</option>
                {monteurs.map(monteur => (
                  <option key={monteur.id} value={monteur.id}>
                    {monteur.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {emergencies.length === 0 && (
          <p className="no-data">Keine Notfälle vorhanden</p>
        )}
      </div>
    </div>
  );

  const renderCreateEmergency = () => (
    <div className="create-emergency-page">
      <div className="page-header">
        <h1>Notfall melden</h1>
        <button 
          className="btn btn-secondary"
          onClick={() => setActiveTab('emergencies')}
        >
          Zurück zu Notfällen
        </button>
      </div>

      <form className="emergency-form" onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        handleCreateEmergency({
          title: formData.get('title'),
          description: formData.get('description'),
          location: formData.get('location'),
          priority: formData.get('priority'),
          assigned_to: formData.get('assigned_to') || null
        });
        setActiveTab('emergencies');
      }}>
        <div className="form-group">
          <label>Titel *</label>
          <input type="text" name="title" required />
        </div>
        <div className="form-group">
          <label>Beschreibung *</label>
          <textarea name="description" rows="3" required></textarea>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Ort *</label>
            <input type="text" name="location" required />
          </div>
          <div className="form-group">
            <label>Priorität *</label>
            <select name="priority" required>
              <option value="">Bitte wählen...</option>
              <option value="normal">Normal</option>
              <option value="high">Hoch</option>
              <option value="urgent">Dringend</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Zuweisen an</label>
          <select name="assigned_to">
            <option value="">Nicht zuweisen</option>
            {monteurs.map(monteur => (
              <option key={monteur.id} value={monteur.id}>
                {monteur.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Notfall melden
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => setActiveTab('emergencies')}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );

  const renderTimeTracking = () => (
    <div className="time-tracking-page">
      <div className="page-header">
        <h1>Zeiterfassungen einsehen</h1>
      </div>

      <div className="time-entries-table">
        <table>
          <thead>
            <tr>
              <th>Monteur</th>
              <th>Datum</th>
              <th>Einstempel</th>
              <th>Ausstempel</th>
              <th>Arbeitszeit</th>
              <th>Ort</th>
              <th>Notizen</th>
            </tr>
          </thead>
          <tbody>
            {timeEntries.map(entry => {
              const clockIn = new Date(entry.clock_in);
              const clockOut = entry.clock_out ? new Date(entry.clock_out) : null;
              const workTime = clockOut ? 
                Math.round((clockOut - clockIn) / (1000 * 60 * 60) * 100) / 100 : 
                Math.round((new Date() - clockIn) / (1000 * 60 * 60) * 100) / 100;
              
              return (
                <tr key={entry.id}>
                  <td>Monteur {entry.user_id}</td>
                  <td>{formatDate(entry.clock_in)}</td>
                  <td>{formatTime(entry.clock_in)}</td>
                  <td>{clockOut ? formatTime(entry.clock_out) : '-'}</td>
                  <td>{workTime}h</td>
                  <td>{entry.location || '-'}</td>
                  <td>{entry.notes || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {timeEntries.length === 0 && (
          <p className="no-data">Keine Zeiteinträge vorhanden</p>
        )}
      </div>
    </div>
  );

  const renderMonteurs = () => (
    <div className="monteurs-page">
      <div className="page-header">
        <h1>Monteure verwalten</h1>
      </div>

      <div className="monteurs-grid">
        {monteurs.map(monteur => (
          <div key={monteur.id} className="monteur-card">
            <div className="monteur-header">
              <h3>{monteur.name}</h3>
              <span className="status-indicator available">Verfügbar</span>
            </div>
            <div className="monteur-details">
              <p><strong>ID:</strong> {monteur.id}</p>
              <p><strong>Rolle:</strong> {monteur.role}</p>
            </div>
          </div>
        ))}
        {monteurs.length === 0 && (
          <p className="no-data">Keine Monteure verfügbar</p>
        )}
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="customers-page">
      <div className="page-header">
        <h1>Kunden verwalten</h1>
      </div>

      <div className="customers-grid">
        {customers.map(customer => (
          <div key={customer.id} className="customer-card">
            <div className="customer-header">
              <h3>{customer.name}</h3>
            </div>
            <div className="customer-details">
              <p><strong>Ansprechpartner:</strong> {customer.contact_person}</p>
              <p><strong>Email:</strong> {customer.email}</p>
              <p><strong>Telefon:</strong> {customer.phone}</p>
              <p><strong>Adresse:</strong> {customer.address}</p>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="no-data">Keine Kunden vorhanden</p>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'orders':
        return renderOrders();
      case 'create-order':
        return renderCreateOrder();
      case 'emergencies':
        return renderEmergencies();
      case 'create-emergency':
        return renderCreateEmergency();
      case 'time-tracking':
        return renderTimeTracking();
      case 'monteurs':
        return renderMonteurs();
      case 'customers':
        return renderCustomers();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="buero-dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Büro Dashboard</h2>
          <div className="user-info">
            <span>Willkommen, {user?.name || 'Büro'}!</span>
            <button onClick={() => { onLogout(); }} className="logout-btn">
              Abmelden
            </button>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Aufträge
          </button>
          <button 
            className={`nav-item ${activeTab === 'emergencies' ? 'active' : ''}`}
            onClick={() => setActiveTab('emergencies')}
          >
            🚨 Notfälle
          </button>
          <button 
            className={`nav-item ${activeTab === 'time-tracking' ? 'active' : ''}`}
            onClick={() => setActiveTab('time-tracking')}
          >
            ⏰ Zeiterfassung
          </button>
          <button 
            className={`nav-item ${activeTab === 'monteurs' ? 'active' : ''}`}
            onClick={() => setActiveTab('monteurs')}
          >
            👥 Monteure
          </button>
          <button 
            className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            🏢 Kunden
          </button>
        </nav>
      </div>

      <div className="main-content">
        {loading ? (
          <div className="loading">Lade Daten...</div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default BueroDashboard; 