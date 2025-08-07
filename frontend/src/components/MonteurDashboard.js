import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MonteurDashboard.css';

// API Base URL - Production vs Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

const MonteurDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Dashboard-States
  const [weather, setWeather] = useState({
    temperature: 22,
    condition: 'Sonnig',
    icon: '☀️',
    city: 'München'
  });

  const [currentStatus, setCurrentStatus] = useState({
    is_working: false,
    is_on_break: false,
    work_start_time: null,
    break_start_time: null,
    current_work_time: 0,
    current_break_time: 0
  });

  const [nextOrder, setNextOrder] = useState({
    time: '14:30',
    type: 'Wartung',
    location: 'München Zentrum',
    remainingTime: '2:15h',
    priority: 'normal'
  });

  const [orderStats, setOrderStats] = useState({
    open: 3,
    completed: 7,
    total: 10,
    byType: {
      'Wartung': { open: 2, completed: 4 },
      'Reparatur': { open: 1, completed: 2 },
      'Installation': { open: 0, completed: 1 }
    }
  });

  const [workStats, setWorkStats] = useState({
    todayHours: 6.5,
    weekHours: 32.5,
    overtime: 2.5,
    mealAllowance: 3
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
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCurrentStatus(),
        loadWeather(),
        loadNextOrder(),
        loadOrderStats(),
        loadWorkStats()
      ]);
    } catch (error) {
      setMessage('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lädt aktuellen Arbeitsstatus
   */
  const loadCurrentStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/current-status`);
      if (response.data.success) {
        setCurrentStatus(response.data);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
    }
  };

  /**
   * Lädt Wetterdaten
   */
  const loadWeather = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/weather`);
      if (response.data.success) {
        setWeather(response.data.weather);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
    }
  };

  /**
   * Lädt nächsten Auftrag
   */
  const loadNextOrder = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/orders`);
      if (response.data.success && response.data.orders.length > 0) {
        const nextOrder = response.data.orders.find(order => order.status === 'assigned');
        if (nextOrder) {
          setNextOrder({
            time: nextOrder.start_time || '14:30',
            type: getOrderTypeLabel(nextOrder.order_type),
            location: nextOrder.location,
            remainingTime: '2:15h',
            priority: nextOrder.priority
          });
        }
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
    }
  };

  /**
   * Lädt Auftragsstatistiken
   */
  const loadOrderStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/orders`);
      if (response.data.success) {
        const orders = response.data.orders;
        const stats = {
          open: orders.filter(o => o.status === 'assigned').length,
          completed: orders.filter(o => o.status === 'completed').length,
          total: orders.length,
          byType: {}
        };

        orders.forEach(order => {
          const type = getOrderTypeLabel(order.order_type);
          if (!stats.byType[type]) {
            stats.byType[type] = { open: 0, completed: 0 };
          }
          if (order.status === 'assigned') {
            stats.byType[type].open++;
          } else if (order.status === 'completed') {
            stats.byType[type].completed++;
          }
        });

        setOrderStats(stats);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
    }
  };

  /**
   * Lädt Arbeitsstatistiken
   */
  const loadWorkStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/time-entries`);
      if (response.data.success) {
        // TODO: Implementiere echte Statistik-Berechnung
        setWorkStats({
          todayHours: 6.5,
          weekHours: 32.5,
          overtime: 2.5,
          mealAllowance: 3
        });
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
    }
  };

  // Helper functions
  const formatTime = (date) => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}h`;
  };

  const getOrderTypeLabel = (type) => {
    const typeLabels = {
      'maintenance': 'Wartung',
      'repair': 'Reparatur',
      'installation': 'Installation',
      'inspection': 'Prüfung'
    };
    return typeLabels[type] || type;
  };

  const getPriorityLabel = (priority) => {
    const priorityLabels = {
      'low': 'Niedrig',
      'normal': 'Normal',
      'high': 'Hoch',
      'urgent': 'Dringend'
    };
    return priorityLabels[priority] || priority;
  };

  const getWorkWarning = () => {
    if (workStats.todayHours > 10) {
      return { type: 'critical', message: 'Über 10 Stunden gearbeitet!' };
    } else if (workStats.todayHours > 8) {
      return { type: 'warning', message: 'Überstunden - Genehmigung erforderlich' };
    }
    return null;
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'clock-in':
        handleClockIn();
        break;
      case 'clock-out':
        handleClockOut();
        break;
      case 'break':
        handleBreak();
        break;
      case 'emergency':
        handleEmergency();
        break;
      case 'orders':
        navigate('/monteur/auftraege');
        break;
      case 'time-entries':
        navigate('/monteur/zeiterfassungen');
        break;
      case 'work-time':
        navigate('/monteur/arbeitszeit');
        break;
      default:
        break;
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/clock-in`);
      if (response.data.success) {
        setMessage('Erfolgreich eingestempelt!');
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
      const response = await axios.post(`${API_BASE_URL}/api/monteur/clock-out`);
      if (response.data.success) {
        setMessage('Erfolgreich ausgestempelt!');
        await loadCurrentStatus();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Ausstempeln');
    }
    setLoading(false);
  };

  const handleBreak = async () => {
    setLoading(true);
    setMessage('');
    try {
      const endpoint = currentStatus.is_on_break ? 'break-end' : 'break-start';
      const response = await axios.post(`${API_BASE_URL}/api/monteur/${endpoint}`);
      if (response.data.success) {
        setMessage(response.data.message);
        await loadCurrentStatus();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler bei der Pausenverwaltung');
    }
    setLoading(false);
  };

  const handleEmergency = () => {
    // TODO: Implementiere Notfall-Funktionalität
    setMessage('Notfall-Funktion wird implementiert...');
  };

  return (
    <div className="monteur-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <div className="user-avatar">👷</div>
            <div className="user-details">
              <h2>Willkommen, {user?.name || 'Monteur'}!</h2>
              <p>{formatDate(currentTime)}</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={onLogout}
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`dashboard-message ${message.includes('Fehler') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {/* Live Timer Section */}
        <div className="timer-section">
          <div className="current-time-display">
            <div className="time-label">Aktuelle Zeit</div>
            <div className="time-value">{formatTime(currentTime)}</div>
          </div>
          
          {currentStatus.is_working && (
            <div className="work-time-display">
              <div className="time-label">Arbeitszeit</div>
              <div className="time-value work">
                {formatDuration(currentStatus.current_work_time)}
              </div>
            </div>
          )}
          
          {currentStatus.is_on_break && (
            <div className="break-time-display">
              <div className="time-label">Pause</div>
              <div className="time-value break">
                {formatDuration(currentStatus.current_break_time)}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Schnellaktionen</h3>
          <div className="actions-grid">
            {!currentStatus.is_working ? (
              <button 
                className="action-btn primary"
                onClick={() => handleQuickAction('clock-in')}
                disabled={loading}
              >
                <span className="action-icon">⏰</span>
                <span className="action-text">Einstempeln</span>
              </button>
            ) : (
              <>
                <button 
                  className="action-btn secondary"
                  onClick={() => handleQuickAction('break')}
                  disabled={loading}
                >
                  <span className="action-icon">
                    {currentStatus.is_on_break ? '▶️' : '⏸️'}
                  </span>
                  <span className="action-text">
                    {currentStatus.is_on_break ? 'Weiter' : 'Pause'}
                  </span>
                </button>
                <button 
                  className="action-btn danger"
                  onClick={() => handleQuickAction('clock-out')}
                  disabled={loading}
                >
                  <span className="action-icon">⏹️</span>
                  <span className="action-text">Ausstempeln</span>
                </button>
              </>
            )}
            
            <button 
              className="action-btn warning"
              onClick={() => handleQuickAction('emergency')}
              disabled={loading}
            >
              <span className="action-icon">🚨</span>
              <span className="action-text">Notfall</span>
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="status-overview">
          <div className="status-card">
            <div className="status-icon">
              {currentStatus.is_working ? '🟢' : '🔴'}
            </div>
            <div className="status-content">
              <div className="status-label">Arbeitsstatus</div>
              <div className="status-value">
                {currentStatus.is_working ? 'Arbeitet' : 'Nicht eingestempelt'}
              </div>
            </div>
          </div>
          
          {currentStatus.is_on_break && (
            <div className="status-card break">
              <div className="status-icon">⏸️</div>
              <div className="status-content">
                <div className="status-label">Pausenstatus</div>
                <div className="status-value">Pause</div>
              </div>
            </div>
          )}
        </div>

        {/* Weather Widget */}
        <div className="weather-widget">
          <h3>Wetter</h3>
          <div className="weather-content">
            <div className="weather-icon">{weather.icon}</div>
            <div className="weather-info">
              <div className="temperature">{weather.temperature}°C</div>
              <div className="condition">{weather.condition}</div>
              <div className="location">{weather.city}</div>
            </div>
          </div>
        </div>

        {/* Next Order */}
        <div className="next-order">
          <h3>Nächster Auftrag</h3>
          <div className="order-card">
            <div className="order-header">
              <div className="order-time">{nextOrder.time}</div>
              <div className={`order-priority ${nextOrder.priority}`}>
                {getPriorityLabel(nextOrder.priority)}
              </div>
            </div>
            <div className="order-content">
              <div className="order-type">{nextOrder.type}</div>
              <div className="order-location">{nextOrder.location}</div>
              <div className="order-remaining">
                Verbleibende Zeit: {nextOrder.remainingTime}
              </div>
            </div>
            <div className="order-actions">
              <button className="btn btn-secondary btn-small">
                Details anzeigen
              </button>
              <button className="btn btn-primary btn-small">
                Navigation starten
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="statistics-section">
          <h3>Statistiken</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{workStats.todayHours}h</div>
                <div className="stat-label">Heute gearbeitet</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value">{workStats.weekHours}h</div>
                <div className="stat-label">Diese Woche</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-content">
                <div className="stat-value">{workStats.overtime}h</div>
                <div className="stat-label">Überstunden</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🍽️</div>
              <div className="stat-content">
                <div className="stat-value">{workStats.mealAllowance}</div>
                <div className="stat-label">Verpflegungsmehraufwand</div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Statistics */}
        <div className="order-statistics">
          <h3>Aufträge</h3>
          <div className="order-stats-grid">
            <div className="order-stat-card">
              <div className="stat-number">{orderStats.open}</div>
              <div className="stat-label">Offen</div>
            </div>
            <div className="order-stat-card">
              <div className="stat-number">{orderStats.completed}</div>
              <div className="stat-label">Abgeschlossen</div>
            </div>
            <div className="order-stat-card">
              <div className="stat-number">{orderStats.total}</div>
              <div className="stat-label">Gesamt</div>
            </div>
          </div>
          
          <div className="order-type-breakdown">
            {Object.entries(orderStats.byType).map(([type, stats]) => (
              <div key={type} className="order-type-item">
                <div className="type-name">{type}</div>
                <div className="type-stats">
                  <span className="open-count">{stats.open} offen</span>
                  <span className="completed-count">{stats.completed} abgeschlossen</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Warning */}
        {getWorkWarning() && (
          <div className={`work-warning ${getWorkWarning().type}`}>
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">{getWorkWarning().message}</span>
          </div>
        )}

        {/* Navigation */}
        <div className="dashboard-navigation">
          <h3>Schnellzugriff</h3>
          <div className="nav-grid">
            <button 
              className="nav-card"
              onClick={() => handleQuickAction('time-entries')}
            >
              <div className="nav-icon">📝</div>
              <div className="nav-text">Zeiterfassungen</div>
            </button>
            
            <button 
              className="nav-card"
              onClick={() => handleQuickAction('work-time')}
            >
              <div className="nav-icon">⏱️</div>
              <div className="nav-text">Arbeitszeit</div>
            </button>
            
            <button 
              className="nav-card"
              onClick={() => handleQuickAction('orders')}
            >
              <div className="nav-icon">📋</div>
              <div className="nav-text">Aufträge</div>
            </button>
            
            <button 
              className="nav-card"
              onClick={() => navigate('/monteur/profil')}
            >
              <div className="nav-icon">👤</div>
              <div className="nav-text">Profil</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonteurDashboard;
