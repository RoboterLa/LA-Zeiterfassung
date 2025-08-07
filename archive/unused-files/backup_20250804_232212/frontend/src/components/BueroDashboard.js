import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BueroDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [monteurs, setMonteurs] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

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
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock-Daten für das Büro-Dashboard
      setOrders([
        {
          id: 1,
          title: 'Wartung Aufzug Hauptstraße 15',
          customer: 'Gebäudeverwaltung München',
          location: 'Hauptstraße 15, München',
          type: 'maintenance',
          priority: 'normal',
          status: 'assigned',
          assignedTo: 'Max Mustermann',
          createdDate: '2025-01-20',
          dueDate: '2025-01-25'
        },
        {
          id: 2,
          title: 'Reparatur Aufzug Marienplatz',
          customer: 'Stadt München',
          location: 'Marienplatz 1, München',
          type: 'repair',
          priority: 'urgent',
          status: 'in_progress',
          assignedTo: 'Anna Schmidt',
          createdDate: '2025-01-19',
          dueDate: '2025-01-22'
        },
        {
          id: 3,
          title: 'Installation neuer Aufzug',
          customer: 'Bauprojekt GmbH',
          location: 'Neubau Zentrum, München',
          type: 'installation',
          priority: 'high',
          status: 'pending',
          assignedTo: null,
          createdDate: '2025-01-18',
          dueDate: '2025-02-15'
        }
      ]);

      setMonteurs([
        { id: 1, name: 'Max Mustermann', status: 'available', currentLocation: 'München Zentrum' },
        { id: 2, name: 'Anna Schmidt', status: 'working', currentLocation: 'Marienplatz' },
        { id: 3, name: 'Tom Weber', status: 'available', currentLocation: 'München Nord' },
        { id: 4, name: 'Lisa Müller', status: 'on_call', currentLocation: 'München Süd' }
      ]);

      setEmergencies([
        {
          id: 1,
          title: 'Aufzug steckt fest',
          location: 'Marienplatz 1, München',
          priority: 'urgent',
          status: 'active',
          reportedAt: '2025-01-20 14:30',
          assignedTo: 'Anna Schmidt'
        }
      ]);

      setTimeEntries([
        {
          id: 1,
          monteur: 'Max Mustermann',
          date: '2025-01-20',
          clockIn: '08:00',
          clockOut: '17:00',
          totalHours: 9,
          location: 'Hauptstraße 15, München'
        },
        {
          id: 2,
          monteur: 'Anna Schmidt',
          date: '2025-01-20',
          clockIn: '07:30',
          clockOut: null,
          totalHours: 10.5,
          location: 'Marienplatz 1, München'
        }
      ]);

      setCustomers([
        { id: 1, name: 'Gebäudeverwaltung München', contact: 'Herr Meyer', phone: '089-123456' },
        { id: 2, name: 'Stadt München', contact: 'Frau Schmidt', phone: '089-654321' },
        { id: 3, name: 'Bauprojekt GmbH', contact: 'Herr Weber', phone: '089-789123' }
      ]);

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('de-DE');
  };

  const getOrderTypeLabel = (type) => {
    const types = {
      maintenance: 'Wartung',
      repair: 'Reparatur',
      installation: 'Installation',
      inspection: 'Prüfung'
    };
    return types[type] || type;
  };

  const getPriorityLabel = (priority) => {
    const priorities = {
      urgent: 'Notfall',
      high: 'Hoch',
      normal: 'Normal',
      low: 'Niedrig'
    };
    return priorities[priority] || priority;
  };

  const getStatusLabel = (status) => {
    const statuses = {
      pending: 'Ausstehend',
      assigned: 'Zugewiesen',
      in_progress: 'In Bearbeitung',
      completed: 'Abgeschlossen',
      cancelled: 'Storniert'
    };
    return statuses[status] || status;
  };

  const getMonteurStatusLabel = (status) => {
    const statuses = {
      available: 'Verfügbar',
      working: 'Arbeitet',
      on_call: 'Notdienst',
      vacation: 'Urlaub',
      sick: 'Krank'
    };
    return statuses[status] || status;
  };

  const handleAssignOrder = (orderId, monteurId) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, assignedTo: monteurs.find(m => m.id === monteurId)?.name, status: 'assigned' }
        : order
    ));
  };

  const handleCreateOrder = (newOrder) => {
    const order = {
      id: orders.length + 1,
      ...newOrder,
      status: 'pending',
      assignedTo: null,
      createdDate: new Date().toISOString().split('T')[0]
    };
    setOrders([...orders, order]);
  };

  const handleCreateEmergency = (newEmergency) => {
    const emergency = {
      id: emergencies.length + 1,
      ...newEmergency,
      status: 'active',
      reportedAt: new Date().toLocaleString('de-DE')
    };
    setEmergencies([...emergencies, emergency]);
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-info">
          <h2>Büro Dashboard</h2>
          <div className="current-time">
            {formatDate(currentTime)} - {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* Übersichtskarten */}
      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-header">
            <h3>Offene Aufträge</h3>
            <div className="card-number">{orders.filter(o => o.status === 'pending').length}</div>
          </div>
          <div className="card-content">
            <div className="stats-row">
              <span>In Bearbeitung: {orders.filter(o => o.status === 'in_progress').length}</span>
              <span>Zugewiesen: {orders.filter(o => o.status === 'assigned').length}</span>
            </div>
            <button className="card-btn" onClick={() => setActiveTab('orders')}>
              Zu den Aufträgen
            </button>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h3>Aktive Notfälle</h3>
            <div className="card-number">{emergencies.filter(e => e.status === 'active').length}</div>
          </div>
          <div className="card-content">
            <div className="emergency-list">
              {emergencies.filter(e => e.status === 'active').slice(0, 2).map(emergency => (
                <div key={emergency.id} className="emergency-item">
                  <span className="emergency-title">{emergency.title}</span>
                  <span className="emergency-location">{emergency.location}</span>
                </div>
              ))}
            </div>
            <button className="card-btn" onClick={() => setActiveTab('emergencies')}>
              Notfälle verwalten
            </button>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h3>Verfügbare Monteure</h3>
            <div className="card-number">{monteurs.filter(m => m.status === 'available').length}</div>
          </div>
          <div className="card-content">
            <div className="monteur-list">
              {monteurs.filter(m => m.status === 'available').slice(0, 3).map(monteur => (
                <div key={monteur.id} className="monteur-item">
                  <span className="monteur-name">{monteur.name}</span>
                  <span className="monteur-location">{monteur.currentLocation}</span>
                </div>
              ))}
            </div>
            <button className="card-btn" onClick={() => setActiveTab('monteurs')}>
              Monteure verwalten
            </button>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h3>Heutige Zeiterfassungen</h3>
            <div className="card-number">{timeEntries.length}</div>
          </div>
          <div className="card-content">
            <div className="time-summary">
              <div>Arbeitende: {timeEntries.filter(t => !t.clockOut).length}</div>
              <div>Durchschnitt: 8.5h</div>
            </div>
            <button className="card-btn" onClick={() => setActiveTab('time-tracking')}>
              Zeiterfassungen einsehen
            </button>
          </div>
        </div>
      </div>

      {/* Aktuelle Aktivitäten */}
      <div className="recent-activities">
        <h3>Aktuelle Aktivitäten</h3>
        <div className="activity-list">
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="activity-item">
              <div className="activity-icon">📋</div>
              <div className="activity-content">
                <div className="activity-title">{order.title}</div>
                <div className="activity-details">
                  {order.assignedTo ? `Zugewiesen an: ${order.assignedTo}` : 'Noch nicht zugewiesen'}
                </div>
              </div>
              <div className="activity-status">{getStatusLabel(order.status)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="orders-content">
      <div className="content-header">
        <h2>Aufträge verwalten</h2>
        <button className="btn-primary" onClick={() => setActiveTab('create-order')}>
          Neuen Auftrag erstellen
        </button>
      </div>

      <div className="orders-filters">
        <select defaultValue="all">
          <option value="all">Alle Status</option>
          <option value="pending">Ausstehend</option>
          <option value="assigned">Zugewiesen</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="completed">Abgeschlossen</option>
        </select>
        <select defaultValue="all">
          <option value="all">Alle Prioritäten</option>
          <option value="urgent">Notfall</option>
          <option value="high">Hoch</option>
          <option value="normal">Normal</option>
        </select>
        <select defaultValue="all">
          <option value="all">Alle Typen</option>
          <option value="maintenance">Wartung</option>
          <option value="repair">Reparatur</option>
          <option value="installation">Installation</option>
        </select>
      </div>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h3>{order.title}</h3>
              <div className="order-badges">
                <span className={`priority-badge ${order.priority}`}>
                  {getPriorityLabel(order.priority)}
                </span>
                <span className={`status-badge ${order.status}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>
            
            <div className="order-details">
              <p><strong>Kunde:</strong> {order.customer}</p>
              <p><strong>Standort:</strong> {order.location}</p>
              <p><strong>Typ:</strong> {getOrderTypeLabel(order.type)}</p>
              <p><strong>Erstellt:</strong> {order.createdDate}</p>
              <p><strong>Fällig:</strong> {order.dueDate}</p>
              {order.assignedTo && (
                <p><strong>Zugewiesen an:</strong> {order.assignedTo}</p>
              )}
            </div>
            
            <div className="order-actions">
              {!order.assignedTo && (
                <select 
                  onChange={(e) => handleAssignOrder(order.id, parseInt(e.target.value))}
                  className="assign-select"
                >
                  <option value="">Monteur zuweisen</option>
                  {monteurs.filter(m => m.status === 'available').map(monteur => (
                    <option key={monteur.id} value={monteur.id}>
                      {monteur.name} - {monteur.currentLocation}
                    </option>
                  ))}
                </select>
              )}
              <button className="btn-secondary">Details</button>
              <button className="btn-secondary">Bearbeiten</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreateOrder = () => (
    <div className="create-order-content">
      <div className="content-header">
        <h2>Neuen Auftrag erstellen</h2>
        <button className="btn-secondary" onClick={() => setActiveTab('orders')}>
          Zurück zu Aufträgen
        </button>
      </div>

      <div className="create-order-form">
        <div className="form-group">
          <label>Titel:</label>
          <input type="text" placeholder="Auftragstitel eingeben" />
        </div>
        
        <div className="form-group">
          <label>Kunde:</label>
          <select>
            <option value="">Kunde auswählen</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Standort:</label>
          <input type="text" placeholder="Standort eingeben" />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Typ:</label>
            <select>
              <option value="maintenance">Wartung</option>
              <option value="repair">Reparatur</option>
              <option value="installation">Installation</option>
              <option value="inspection">Prüfung</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Priorität:</label>
            <select>
              <option value="normal">Normal</option>
              <option value="high">Hoch</option>
              <option value="urgent">Notfall</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Beschreibung:</label>
          <textarea placeholder="Detaillierte Beschreibung des Auftrags"></textarea>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Erstellt am:</label>
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          
          <div className="form-group">
            <label>Fällig am:</label>
            <input type="date" />
          </div>
        </div>
        
        <div className="form-actions">
          <button className="btn-primary">Auftrag erstellen</button>
          <button className="btn-secondary">Abbrechen</button>
        </div>
      </div>
    </div>
  );

  const renderEmergencies = () => (
    <div className="emergencies-content">
      <div className="content-header">
        <h2>Notfälle verwalten</h2>
        <button className="btn-primary" onClick={() => setActiveTab('create-emergency')}>
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
              <p><strong>Standort:</strong> {emergency.location}</p>
              <p><strong>Gemeldet:</strong> {emergency.reportedAt}</p>
              <p><strong>Status:</strong> {emergency.status}</p>
              {emergency.assignedTo && (
                <p><strong>Zugewiesen an:</strong> {emergency.assignedTo}</p>
              )}
            </div>
            
            <div className="emergency-actions">
              {!emergency.assignedTo && (
                <select className="assign-select">
                  <option value="">Monteur zuweisen</option>
                  {monteurs.filter(m => m.status === 'available').map(monteur => (
                    <option key={monteur.id} value={monteur.id}>
                      {monteur.name}
                    </option>
                  ))}
                </select>
              )}
              <button className="btn-secondary">Details</button>
              <button className="btn-secondary">Als erledigt markieren</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreateEmergency = () => (
    <div className="create-emergency-content">
      <div className="content-header">
        <h2>Notfall melden</h2>
        <button className="btn-secondary" onClick={() => setActiveTab('emergencies')}>
          Zurück zu Notfällen
        </button>
      </div>

      <div className="create-emergency-form">
        <div className="form-group">
          <label>Notfall-Titel:</label>
          <input type="text" placeholder="Kurze Beschreibung des Notfalls" />
        </div>
        
        <div className="form-group">
          <label>Standort:</label>
          <input type="text" placeholder="Exakte Adresse" />
        </div>
        
        <div className="form-group">
          <label>Priorität:</label>
          <select>
            <option value="urgent">Notfall</option>
            <option value="high">Hoch</option>
            <option value="normal">Normal</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Beschreibung:</label>
          <textarea placeholder="Detaillierte Beschreibung des Problems"></textarea>
        </div>
        
        <div className="form-group">
          <label>Kontakt vor Ort:</label>
          <input type="text" placeholder="Name und Telefonnummer" />
        </div>
        
        <div className="form-actions">
          <button className="btn-primary">Notfall melden</button>
          <button className="btn-secondary">Abbrechen</button>
        </div>
      </div>
    </div>
  );

  const renderTimeTracking = () => (
    <div className="time-tracking-content">
      <div className="content-header">
        <h2>Zeiterfassungen einsehen</h2>
      </div>

      <div className="time-filters">
        <select defaultValue="today">
          <option value="today">Heute</option>
          <option value="week">Diese Woche</option>
          <option value="month">Dieser Monat</option>
        </select>
        <select defaultValue="all">
          <option value="all">Alle Monteure</option>
          {monteurs.map(monteur => (
            <option key={monteur.id} value={monteur.id}>{monteur.name}</option>
          ))}
        </select>
      </div>

      <div className="time-summary">
        <div className="summary-card">
          <h3>Gesamtstunden heute</h3>
          <div className="summary-number">
            {timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)}h
          </div>
        </div>
        <div className="summary-card">
          <h3>Aktuell arbeitend</h3>
          <div className="summary-number">
            {timeEntries.filter(entry => !entry.clockOut).length}
          </div>
        </div>
        <div className="summary-card">
          <h3>Durchschnitt pro Monteur</h3>
          <div className="summary-number">
            {(timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0) / monteurs.length).toFixed(1)}h
          </div>
        </div>
      </div>

      <div className="time-entries-list">
        {timeEntries.map(entry => (
          <div key={entry.id} className="time-entry-card">
            <div className="entry-header">
              <h3>{entry.monteur}</h3>
              <span className={`status-badge ${entry.clockOut ? 'completed' : 'working'}`}>
                {entry.clockOut ? 'Beendet' : 'Arbeitet'}
              </span>
            </div>
            
            <div className="entry-details">
              <p><strong>Datum:</strong> {entry.date}</p>
              <p><strong>Einstempelung:</strong> {entry.clockIn}</p>
              {entry.clockOut && (
                <p><strong>Ausstempelung:</strong> {entry.clockOut}</p>
              )}
              <p><strong>Gesamtstunden:</strong> {entry.totalHours}h</p>
              <p><strong>Standort:</strong> {entry.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonteurs = () => (
    <div className="monteurs-content">
      <div className="content-header">
        <h2>Monteure verwalten</h2>
        <button className="btn-primary">Neuen Monteur hinzufügen</button>
      </div>

      <div className="monteurs-list">
        {monteurs.map(monteur => (
          <div key={monteur.id} className="monteur-card">
            <div className="monteur-header">
              <h3>{monteur.name}</h3>
              <span className={`status-badge ${monteur.status}`}>
                {getMonteurStatusLabel(monteur.status)}
              </span>
            </div>
            
            <div className="monteur-details">
              <p><strong>Aktueller Standort:</strong> {monteur.currentLocation}</p>
              <p><strong>Status:</strong> {getMonteurStatusLabel(monteur.status)}</p>
            </div>
            
            <div className="monteur-actions">
              <button className="btn-secondary">Details</button>
              <button className="btn-secondary">Bearbeiten</button>
              <button className="btn-secondary">Zeiterfassung</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="customers-content">
      <div className="content-header">
        <h2>Stammdaten verwalten</h2>
        <button className="btn-primary">Neuen Kunden hinzufügen</button>
      </div>

      <div className="customers-list">
        {customers.map(customer => (
          <div key={customer.id} className="customer-card">
            <div className="customer-header">
              <h3>{customer.name}</h3>
            </div>
            
            <div className="customer-details">
              <p><strong>Kontakt:</strong> {customer.contact}</p>
              <p><strong>Telefon:</strong> {customer.phone}</p>
            </div>
            
            <div className="customer-actions">
              <button className="btn-secondary">Details</button>
              <button className="btn-secondary">Bearbeiten</button>
              <button className="btn-secondary">Aufträge</button>
            </div>
          </div>
        ))}
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
      {/* Navigation */}
      <div className="dashboard-nav">
        <div className="nav-item" onClick={() => setActiveTab('dashboard')}>
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('orders')}>
          <span className="nav-icon">📋</span>
          <span>Aufträge</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('emergencies')}>
          <span className="nav-icon">🚨</span>
          <span>Notfälle</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('time-tracking')}>
          <span className="nav-icon">⏰</span>
          <span>Zeiterfassung</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('monteurs')}>
          <span className="nav-icon">👷</span>
          <span>Monteure</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('customers')}>
          <span className="nav-icon">👥</span>
          <span>Stammdaten</span>
        </div>
      </div>

      {/* Hauptinhalt */}
      <div className="dashboard-main">
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