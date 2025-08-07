import React, { useState, useEffect } from 'react';
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
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalOrders: 0,
    openOrders: 0,
    completedOrders: 0,
    totalHours: 0,
    overtimeHours: 0,
    revenue: 0
  });

  // Mitarbeiter-States
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Auftrags-States
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Lade Daten beim Start
  useEffect(() => {
    loadDashboardData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /**
   * Lädt Dashboard-Daten vom Server
   */
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/buero/dashboard`, {
        withCredentials: true
      });
      if (response.data.success) {
        setStats(response.data.stats);
        setEmployees(response.data.employees || []);
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
      setStats({
        totalEmployees: 12,
        activeEmployees: 8,
        totalOrders: 156,
        openOrders: 23,
        completedOrders: 133,
        totalHours: 1247.5,
        overtimeHours: 45.2,
        revenue: 125000
      });
      setEmployees([
        { id: 1, name: 'Max Mustermann', role: 'monteur', status: 'active', hours: 42.5, orders: 15 },
        { id: 2, name: 'Anna Schmidt', role: 'monteur', status: 'active', hours: 38.0, orders: 12 },
        { id: 3, name: 'Tom Weber', role: 'monteur', status: 'vacation', hours: 0, orders: 0 },
        { id: 4, name: 'Lisa Müller', role: 'monteur', status: 'sick', hours: 0, orders: 0 }
      ]);
      setOrders([
        { id: 1, title: 'Wartung Aufzug Hauptstraße 15', customer: 'Gebäudeverwaltung München', status: 'in_progress', priority: 'high' },
        { id: 2, title: 'Reparatur Aufzug Marienplatz', customer: 'Stadt München', status: 'open', priority: 'urgent' },
        { id: 3, title: 'Installation Neuer Aufzug', customer: 'Bauprojekt GmbH', status: 'completed', priority: 'normal' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler für Tab-Wechsel
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  /**
   * Handler für Mitarbeiter-Auswahl
   */
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
  };

  /**
   * Handler für Auftrag-Auswahl
   */
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
  };

  /**
   * Handler für Logout
   */
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/logout`, {}, {
        withCredentials: true
      });
      onLogout();
    } catch (error) {
      onLogout();
    }
  };

  /**
   * Formatiert DateTime-String zu Zeit
   */
  const formatTime = (date) => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Formatiert DateTime-String zu Datum
   */
  const formatDate = (date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Gibt den Status-Label zurück
   */
  const getStatusLabel = (status) => {
    const statusLabels = {
      'active': 'Aktiv',
      'vacation': 'Urlaub',
      'sick': 'Krank',
      'inactive': 'Inaktiv'
    };
    return statusLabels[status] || status;
  };

  /**
   * Gibt die Status-Farbe zurück
   */
  const getStatusColor = (status) => {
    const colors = {
      'active': '#16a34a',
      'vacation': '#3b82f6',
      'sick': '#dc2626',
      'inactive': '#6b7280'
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
    <div className="buero-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Büro Dashboard</h1>
            <p>Übersicht und Verwaltung aller Mitarbeiter und Aufträge</p>
          </div>
          <div className="header-right">
            <div className="current-time">
              <div className="time">{formatTime(currentTime)}</div>
              <div className="date">{formatDate(currentTime)}</div>
            </div>
            <button 
              className="btn btn-danger"
              onClick={handleLogout}
            >
              <span className="btn-icon">🚪</span>
              Abmelden
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="dashboard-nav">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <span className="tab-icon">📊</span>
            Übersicht
          </button>
          <button 
            className={`nav-tab ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => handleTabChange('employees')}
          >
            <span className="tab-icon">👥</span>
            Mitarbeiter
          </button>
          <button 
            className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleTabChange('orders')}
          >
            <span className="tab-icon">📋</span>
            Aufträge
          </button>
          <button 
            className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabChange('reports')}
          >
            <span className="tab-icon">📈</span>
            Berichte
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.includes('Fehler') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-content">
          {/* Statistics */}
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalEmployees}</div>
                  <div className="stat-label">Mitarbeiter</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.activeEmployees}</div>
                  <div className="stat-label">Aktiv</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalOrders}</div>
                  <div className="stat-label">Aufträge</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.openOrders}</div>
                  <div className="stat-label">Offen</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalHours}h</div>
                  <div className="stat-label">Arbeitsstunden</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.revenue.toLocaleString()}€</div>
                  <div className="stat-label">Umsatz</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h3>Schnellaktionen</h3>
            <div className="actions-grid">
              <button className="action-card">
                <span className="action-icon">➕</span>
                <span className="action-label">Neuer Auftrag</span>
              </button>
              <button className="action-card">
                <span className="action-icon">👤</span>
                <span className="action-label">Mitarbeiter hinzufügen</span>
              </button>
              <button className="action-card">
                <span className="action-icon">📊</span>
                <span className="action-label">Bericht erstellen</span>
              </button>
              <button className="action-card">
                <span className="action-icon">📧</span>
                <span className="action-label">Nachrichten</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-section">
            <h3>Aktuelle Aktivitäten</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">⏰</div>
                <div className="activity-content">
                  <div className="activity-title">Max Mustermann hat eingestempelt</div>
                  <div className="activity-time">vor 5 Minuten</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">✅</div>
                <div className="activity-content">
                  <div className="activity-title">Auftrag "Wartung Aufzug Hauptstraße 15" abgeschlossen</div>
                  <div className="activity-time">vor 15 Minuten</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <div className="activity-title">Neuer Auftrag erstellt: "Reparatur Marienplatz"</div>
                  <div className="activity-time">vor 1 Stunde</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🏥</div>
                <div className="activity-content">
                  <div className="activity-title">Tom Weber ist krank gemeldet</div>
                  <div className="activity-time">vor 2 Stunden</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="employees-content">
          <div className="employees-header">
            <h3>Mitarbeiterverwaltung</h3>
            <button className="btn btn-primary">
              <span className="btn-icon">➕</span>
              Mitarbeiter hinzufügen
            </button>
          </div>

          <div className="employees-grid">
            {employees.map((employee) => (
              <div 
                key={employee.id} 
                className={`employee-card ${selectedEmployee?.id === employee.id ? 'selected' : ''}`}
                onClick={() => handleEmployeeSelect(employee)}
              >
                <div className="employee-avatar">
                  <div className="avatar-circle">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="employee-info">
                  <h4>{employee.name}</h4>
                  <p className="employee-role">{employee.role === 'monteur' ? 'Monteur' : employee.role}</p>
                  <div className="employee-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(employee.status) }}
                    >
                      {getStatusLabel(employee.status)}
                    </span>
                  </div>
                </div>
                <div className="employee-stats">
                  <div className="stat-item">
                    <span className="stat-label">Stunden</span>
                    <span className="stat-value">{employee.hours}h</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Aufträge</span>
                    <span className="stat-value">{employee.orders}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedEmployee && (
            <div className="employee-details">
              <h4>Details: {selectedEmployee.name}</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{getStatusLabel(selectedEmployee.status)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Arbeitsstunden:</span>
                  <span className="detail-value">{selectedEmployee.hours}h</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Aufträge:</span>
                  <span className="detail-value">{selectedEmployee.orders}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="orders-content">
          <div className="orders-header">
            <h3>Auftragsverwaltung</h3>
            <button className="btn btn-primary">
              <span className="btn-icon">➕</span>
              Neuer Auftrag
            </button>
          </div>

          <div className="orders-grid">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                onClick={() => handleOrderSelect(order)}
              >
                <div className="order-header">
                  <h4>{order.title}</h4>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(order.priority) }}
                  >
                    {order.priority.toUpperCase()}
                  </span>
                </div>
                <div className="order-info">
                  <p className="order-customer">{order.customer}</p>
                  <div className="order-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedOrder && (
            <div className="order-details">
              <h4>Details: {selectedOrder.title}</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Kunde:</span>
                  <span className="detail-value">{selectedOrder.customer}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{getStatusLabel(selectedOrder.status)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priorität:</span>
                  <span className="detail-value">{selectedOrder.priority}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="reports-content">
          <div className="reports-header">
            <h3>Berichte & Analysen</h3>
          </div>

          <div className="reports-grid">
            <div className="report-card">
              <div className="report-icon">📊</div>
              <h4>Arbeitszeit-Bericht</h4>
              <p>Detaillierte Übersicht aller Arbeitszeiten</p>
              <button className="btn btn-secondary">Anzeigen</button>
            </div>
            <div className="report-card">
              <div className="report-icon">💰</div>
              <h4>Umsatz-Bericht</h4>
              <p>Finanzielle Übersicht und Analysen</p>
              <button className="btn btn-secondary">Anzeigen</button>
            </div>
            <div className="report-card">
              <div className="report-icon">👥</div>
              <h4>Mitarbeiter-Bericht</h4>
              <p>Leistungsübersicht aller Mitarbeiter</p>
              <button className="btn btn-secondary">Anzeigen</button>
            </div>
            <div className="report-card">
              <div className="report-icon">📋</div>
              <h4>Auftrags-Bericht</h4>
              <p>Status und Fortschritt aller Aufträge</p>
              <button className="btn btn-secondary">Anzeigen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BueroDashboard; 