import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MonteurDashboard.css';

const MonteurDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeEntries, setTimeEntries] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [weather, setWeather] = useState({
    temperature: 22,
    condition: 'Sonnig',
    icon: '☀️',
    city: 'München'
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // State für Arbeitszeit-Seite
  const [filterData, setFilterData] = useState({
    type: 'today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Mock data für Dashboard
  const [orderStats] = useState({
    open: 3,
    completed: 7,
    total: 10,
    byType: {
      'Wartung': { open: 2, completed: 4 },
      'Reparatur': { open: 1, completed: 2 },
      'Installation': { open: 0, completed: 1 }
    }
  });

  const [nextOrder] = useState({
    time: '14:30',
    type: 'Wartung',
    location: 'München Zentrum',
    remainingTime: '2:15h'
  });

  const [isWorking, setIsWorking] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isOnCall, setIsOnCall] = useState(false);
  const [workEvents, setWorkEvents] = useState([]);
  const [vacationRequests, setVacationRequests] = useState([]);

  // Mock data für Orders-Seite
  const [ordersData, setOrdersData] = useState([]);
  const [nextOrderData, setNextOrderData] = useState(null);
  const [orderStatsData, setOrderStatsData] = useState({
    open: 0,
    completed: 0,
    total: 0,
    byType: {}
  });

  const handleFilterChange = (newFilterData) => {
    setFilterData(newFilterData);
    // Hier würde die API mit den neuen Filter-Daten aufgerufen werden
    loadTimeEntries();
  };

  const handleTimeEntrySaved = () => {
    loadTimeEntries();
    loadCurrentStatus();
  };

  const handleEditEntry = (entry) => {
    // Hier würde ein Modal oder Inline-Formular zum Bearbeiten geöffnet
    console.log('Bearbeite Eintrag:', entry);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    loadData();
    loadWeather();
    
    // Load work time data when tab changes to work-time
    if (activeTab === 'work-time') {
      loadCurrentStatus();
    }
    
    // Load orders data when tab changes to orders
    if (activeTab === 'orders') {
      loadOrdersData();
    }
    
    return () => clearInterval(timer);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const timeResponse = await axios.get('http://localhost:8080/api/monteur/time-entries');
      if (timeResponse.data.success) setTimeEntries(timeResponse.data.time_entries || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeEntries = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/monteur/time-entries');
      if (response.data.success) {
        setTimeEntries(response.data.time_entries || []);
      }
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  };

  const loadCurrentStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/monteur/current-status');
      if (response.data.success) {
        setCurrentStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading current status:', error);
    }
  };

  const loadWeather = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/weather');
      if (response.data.success) {
        setWeather(response.data.weather);
      }
    } catch (error) {
      console.error('Error loading weather:', error);
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

  const getCurrentWorkTime = () => {
    // Always return mock data for now to avoid NaN
    if (isWorking) {
      return 4 * 3600; // 4 hours mock
    }
    return 0;
  };

  const getWorkWarning = () => {
    const currentWorkTime = getCurrentWorkTime();
    const hours = currentWorkTime / 3600;
    
    if (hours > 10) {
      return "⚠️ Arbeitszeit über 10 Stunden - gesetzlich verboten!";
    } else if (hours > 8) {
      return "⚠️ Arbeitszeit über 8 Stunden - Mehrarbeit erforderlich!";
    }
    
    return null;
  };

  const getWeeklyWorkTime = () => {
    // Mock weekly work time calculation
    const currentWorkTime = getCurrentWorkTime();
    const weeklyHours = Math.floor(currentWorkTime / 3600) + 28; // 4 hours today + 28 hours previous days
    return `${Math.floor(weeklyHours)}h ${Math.floor((weeklyHours % 1) * 60)}m`;
  };

  const getOvertime = () => {
    // Mock overtime calculation (standard 40h week)
    const weeklyHours = Math.floor(getCurrentWorkTime() / 3600) + 28;
    const overtime = weeklyHours - 40;
    return overtime > 0 ? `+${Math.floor(overtime)}h ${Math.floor((overtime % 1) * 60)}m` : "0h 0m";
  };

  const getMealAllowance = () => {
    const currentWorkTime = getCurrentWorkTime();
    const hours = currentWorkTime / 3600;
    return hours > 8 ? "Ja (über 8h)" : "Nein";
  };

  const handleClockIn = async () => {
    try {
      const response = await axios.post('http://localhost:8080/api/monteur/clock-in');
      if (response.data.success) {
        setIsWorking(true);
        loadCurrentStatus();
        loadTimeEntries();
      }
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await axios.post('http://localhost:8080/api/monteur/clock-out');
      if (response.data.success) {
        setIsWorking(false);
        loadCurrentStatus();
        loadTimeEntries();
      }
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  const handleStartBreak = async () => {
    try {
      const response = await axios.post('http://localhost:8080/api/monteur/break-start');
      if (response.data.success) {
        setIsOnBreak(true);
        loadCurrentStatus();
      }
    } catch (error) {
      console.error('Error starting break:', error);
    }
  };

  const handleEndBreak = async () => {
    try {
      const response = await axios.post('http://localhost:8080/api/monteur/break-end');
      if (response.data.success) {
        setIsOnBreak(false);
        loadCurrentStatus();
      }
    } catch (error) {
      console.error('Error ending break:', error);
    }
  };

  const loadOrdersData = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/monteur/orders');
      if (response.data.success) {
        const orders = response.data.orders;
        setOrdersData(orders);
        
        // Find next order (first assigned order)
        const nextOrder = orders.find(order => order.status === 'assigned');
        setNextOrderData(nextOrder || null);
        
        // Calculate statistics
        const stats = {
          open: orders.filter(o => o.status === 'assigned').length,
          completed: orders.filter(o => o.status === 'completed').length,
          total: orders.length,
          byType: {}
        };
        
        // Group by order type
        orders.forEach(order => {
          const type = order.order_type || 'maintenance';
          if (!stats.byType[type]) {
            stats.byType[type] = { open: 0, total: 0 };
          }
          stats.byType[type].total++;
          if (order.status === 'assigned') {
            stats.byType[type].open++;
          }
        });
        
        setOrderStatsData(stats);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      // Always use comprehensive mock data for now
      const mockOrders = [
        {
          id: 1,
          title: "Wartung Aufzug Hauptstraße 15",
          location: "Hauptstraße 15, München",
          description: "Regelmäßige Wartung des Personenaufzugs",
          priority: "normal",
          status: "assigned",
          start_time: "08:00",
          coordinates: [48.1351, 11.5820],
          order_type: "maintenance"
        },
        {
          id: 2,
          title: "Reparatur Aufzug Marienplatz 1",
          location: "Marienplatz 1, München",
          description: "Aufzug steckt fest - Notfall",
          priority: "urgent",
          status: "assigned",
          start_time: "10:30",
          coordinates: [48.1374, 11.5755],
          order_type: "repair"
        },
        {
          id: 3,
          title: "Installation Neuer Aufzug",
          location: "Maximilianstraße 45, München",
          description: "Neue Aufzugsanlage installieren",
          priority: "high",
          status: "completed",
          start_time: "07:00",
          coordinates: [48.1396, 11.5802],
          order_type: "installation"
        }
      ];
      setOrdersData(mockOrders);
      setNextOrderData(mockOrders[0]);
      setOrderStatsData({
        open: 2,
        completed: 1,
        total: 3,
        byType: {
          "maintenance": { open: 1, total: 1 },
          "repair": { open: 1, total: 1 },
          "installation": { open: 0, total: 1 }
        }
      });
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:8080/api/monteur/orders/${orderId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        // Reload orders data
        loadOrdersData();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const openNavigation = (coordinates) => {
    if (coordinates) {
      const url = `https://www.openstreetmap.org/?mlat=${coordinates[0]}&mlon=${coordinates[1]}&zoom=15`;
      window.open(url, '_blank');
    }
  };

  // Helper functions for order labels
  const getStatusLabel = (status) => {
    const labels = {
      'assigned': 'Zugewiesen',
      'in_progress': 'In Bearbeitung',
      'completed': 'Abgeschlossen',
      'cancelled': 'Storniert'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'urgent': 'Notfall',
      'high': 'Hoch',
      'normal': 'Normal',
      'low': 'Niedrig'
    };
    return labels[priority] || priority;
  };

  const getOrderTypeLabel = (type) => {
    const labels = {
      'maintenance': 'Wartung',
      'repair': 'Reparatur',
      'installation': 'Installation',
      'inspection': 'Prüfung'
    };
    return labels[type] || type;
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      {/* Header mit Datum und Zeit */}
      <div className="dashboard-header">
        <div className="header-info">
          <h2>Willkommen, {user.name}!</h2>
          <div className="current-time">
            {formatDate(currentTime)} - {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* Störungen/Notfälle - Prominent oben */}
      <div className="alert-section">
        <div className="alert-card urgent">
          <div className="alert-icon">🚨</div>
          <div className="alert-content">
            <h3>Aufzug steckt fest</h3>
            <p>München Zentrum, Marienplatz 1</p>
            <p>Bis: 18:00 Uhr | Priorität: Notfall</p>
            <div className="alert-actions">
              <button className="btn-primary">Navigation starten</button>
              <button className="btn-secondary">Als erledigt markieren</button>
            </div>
          </div>
        </div>
      </div>

      {/* Hauptbereich - 2 Spalten Layout */}
      <div className="main-content-grid">
        {/* Linke Spalte */}
        <div className="left-column">
          {/* Aufträge heute */}
          <div className="info-card">
            <div className="card-header">
              <h3>Meine Aufträge heute</h3>
              <div className="card-number">{orderStatsData?.open || 2}</div>
            </div>
            <div className="card-content">
              <div className="stats-row">
                <span>Erledigt: {orderStatsData?.completed || 1}</span>
                <span>Gesamt: {orderStatsData?.total || 3}</span>
              </div>
              <div className="type-breakdown">
                <div className="type-item">
                  <span>Wartung:</span>
                  <span>{orderStatsData?.byType?.maintenance?.open || 1} offen</span>
                </div>
                <div className="type-item">
                  <span>Reparatur:</span>
                  <span>{orderStatsData?.byType?.repair?.open || 1} offen</span>
                </div>
                <div className="type-item">
                  <span>Installation:</span>
                  <span>{orderStatsData?.byType?.installation?.open || 0} offen</span>
                </div>
              </div>
              <button className="card-btn" onClick={() => setActiveTab('orders')}>
                Zu meinen Aufträgen
              </button>
            </div>
          </div>

          {/* Arbeitszeit */}
          <div className="info-card">
            <div className="card-header">
              <h3>Arbeitszeit</h3>
              <div className="card-number">{formatDuration(getCurrentWorkTime())}</div>
            </div>
            <div className="card-content">
              <div className="work-status">
                {isWorking ? 'Arbeitet' : 'Nicht eingestempelt'}
              </div>
              <div className="work-controls">
                {!isWorking ? (
                  <button onClick={handleClockIn} className="btn-start">Einstempeln</button>
                ) : (
                  <button onClick={handleClockOut} className="btn-stop">Ausstempeln</button>
                )}
              </div>
              <div className="work-summary">
                <div>Heute: {formatDuration(getCurrentWorkTime())}</div>
                <div>Diese Woche: {getWeeklyWorkTime()}</div>
                <div>Überstunden: {getOvertime()}</div>
                <div>Verpflegungsmehraufwand: {getMealAllowance()}</div>
              </div>
              {getWorkWarning() && (
                <div className="work-warning">⚠️ {getWorkWarning()}</div>
              )}
              <button className="card-btn" onClick={() => setActiveTab('work-time')}>
                Arbeitszeit verwalten
              </button>
            </div>
          </div>
        </div>

        {/* Rechte Spalte */}
        <div className="right-column">
          {/* Nächster Auftrag */}
          <div className="info-card">
            <div className="card-header">
              <h3>Nächster Auftrag</h3>
              <div className="card-number">{nextOrderData?.start_time || '08:00'}</div>
            </div>
            <div className="card-content">
              <div className="order-details">
                <p><strong>Art:</strong> {getOrderTypeLabel(nextOrderData?.order_type || 'maintenance')}</p>
                <p><strong>Standort:</strong> {nextOrderData?.location || 'Hauptstraße 15, München'}</p>
                <p><strong>Titel:</strong> {nextOrderData?.title || 'Wartung Aufzug Hauptstraße 15'}</p>
              </div>
              <button className="card-btn" onClick={() => openNavigation(nextOrderData?.coordinates)}>
                Navigation starten
              </button>
            </div>
          </div>

          {/* Wetter */}
          <div className="info-card">
            <div className="card-header">
              <h3>Wetter</h3>
            </div>
            <div className="card-content">
              <div className="weather-display">
                <div className="weather-temp">22°C</div>
                <div className="weather-desc">Sonnig</div>
                <div className="weather-location">München</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Untere Kacheln - 4 Spalten */}
      <div className="bottom-tiles">
        {/* Offene Zeiteinträge */}
        <div className="small-card">
          <div className="card-header">
            <h4>Offene Zeiteinträge</h4>
            <div className="card-number">{timeEntries.filter(entry => !entry.clock_out).length}</div>
          </div>
          <div className="card-content">
            {timeEntries.filter(entry => !entry.clock_out).slice(0, 2).map((entry, index) => (
              <div key={index} className="entry-item">
                <span>{entry.clock_in}</span>
                <span>{entry.location || 'Standort'}</span>
              </div>
            ))}
            <button className="card-btn" onClick={() => setActiveTab('time-tracking')}>
              Zur Zeiterfassung
            </button>
          </div>
        </div>

        {/* Letzte Zeiteinträge */}
        <div className="small-card">
          <div className="card-header">
            <h4>Letzte Zeiteinträge</h4>
          </div>
          <div className="card-content">
            {timeEntries.slice(0, 2).map((entry, index) => (
              <div key={index} className="entry-item">
                <span>{entry.clock_in}</span>
                <span>{entry.location || 'Standort'}</span>
              </div>
            ))}
            <button className="card-btn" onClick={() => setActiveTab('work-time')}>
              Alle Zeiteinträge
            </button>
          </div>
        </div>

        {/* Resturlaub */}
        <div className="small-card">
          <div className="card-header">
            <h4>Resturlaub</h4>
            <div className="card-number">25 Tage</div>
          </div>
          <div className="card-content">
            <div className="vacation-stats">
              <div>Verbraucht: <strong>5 Tage</strong></div>
              <div>Geplant: <strong>3 Tage</strong></div>
              <div>Übrig: <strong>17 Tage</strong></div>
            </div>
            <button className="card-btn">Zur Urlaubsübersicht</button>
          </div>
        </div>

        {/* Notdienst */}
        <div className="small-card">
          <div className="card-header">
            <h4>Notdienst</h4>
            <div className="card-number">{isOnCall ? 'Aktiv' : 'Inaktiv'}</div>
          </div>
          <div className="card-content">
            <div className="oncall-stats">
              <div>Status: <strong>{isOnCall ? 'Bereitschaft' : 'Normal'}</strong></div>
              <div>Zeit: <strong>21:00 - 07:00</strong></div>
              <div>Pauschale: <strong>200€</strong></div>
            </div>
            <button className="card-btn">Notdienst verwalten</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTimeTracking = () => (
    <div className="time-tracking-content">
      <h2>Zeiterfassung</h2>
      
      <div className="time-controls">
        <div className="control-buttons">
          {!isWorking ? (
            <button onClick={handleClockIn} className="clock-in-btn">
              Einstempeln
            </button>
          ) : (
            <button onClick={handleClockOut} className="clock-out-btn">
              Ausstempeln
            </button>
          )}
        </div>
        
        <div className="current-status">
          <div className="status-display">
            {isWorking ? (
              <span className="status-working">Arbeitet seit {formatDuration(getCurrentWorkTime())}</span>
            ) : (
              <span className="status-idle">Nicht eingestempelt</span>
            )}
          </div>
          {getWorkWarning() && (
            <div className="work-warning">{getWorkWarning()}</div>
          )}
        </div>
      </div>

      <div className="time-entries-section">
        <h3>Heutige Zeiteinträge</h3>
        <div className="time-entries-list">
          {timeEntries.length > 0 ? (
            timeEntries.map((entry, index) => (
              <div key={index} className="time-entry">
                <div className="entry-time">
                  <span className="start-time">{entry.clock_in}</span>
                  {entry.clock_out && (
                    <span className="end-time"> - {entry.clock_out}</span>
                  )}
                </div>
                <div className="entry-duration">
                  {entry.duration || '0:00:00'}
                </div>
              </div>
            ))
          ) : (
            <p>Keine Zeiteinträge für heute</p>
          )}
        </div>
      </div>

      <div className="manual-entry-section">
        <h3>Manueller Zeiteintrag</h3>
        <div className="manual-entry-form">
          <div className="form-group">
            <label>Datum:</label>
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="form-group">
            <label>Startzeit:</label>
            <input type="time" />
          </div>
          <div className="form-group">
            <label>Endzeit:</label>
            <input type="time" />
          </div>
          <div className="form-group">
            <label>Standort:</label>
            <input type="text" placeholder="Standort eingeben" />
          </div>
          <div className="form-group">
            <label>Notiz:</label>
            <textarea placeholder="Notiz eingeben"></textarea>
          </div>
          <button className="save-entry-btn">Zeiteintrag speichern</button>
        </div>
      </div>
    </div>
  );

  const renderWorkTime = () => {
    return (
      <div className="work-time-content">
        <h2>Arbeitszeit Verwaltung</h2>
        
        <div className="work-time-overview">
          <div className="overview-card">
            <h3>Heute</h3>
            <div className="work-time-display">{formatDuration(getCurrentWorkTime())}</div>
            <div className="work-time-status">
              {isWorking ? 'Arbeitet' : 'Nicht eingestempelt'}
            </div>
          </div>
          
          <div className="overview-card">
            <h3>Diese Woche</h3>
            <div className="work-time-display">{getWeeklyWorkTime()}</div>
            <div className="work-time-status">{getOvertime()} Überstunden</div>
          </div>
          
          <div className="overview-card">
            <h3>Verpflegungsmehraufwand</h3>
            <div className="work-time-display">{getMealAllowance()}</div>
            <div className="work-time-status">Über 8h auswärts</div>
          </div>
        </div>

        <div className="work-time-controls">
          <button onClick={handleClockIn} className="control-btn start">
            Einstempeln
          </button>
          <button onClick={handleClockOut} className="control-btn stop">
            Ausstempeln
          </button>
          <button onClick={handleStartBreak} className="control-btn break">
            Pause starten
          </button>
          <button onClick={handleEndBreak} className="control-btn break">
            Pause beenden
          </button>
        </div>

        {getWorkWarning() && (
          <div className="work-warning-card">
            <h3>⚠️ Arbeitszeit-Warnung</h3>
            <p>{getWorkWarning()}</p>
            <button className="overtime-request-btn">
              Mehrarbeit beantragen
            </button>
          </div>
        )}

        <div className="work-time-history">
          <h3>Arbeitszeit-Historie</h3>
          <div className="history-filters">
            <select defaultValue="this-week">
              <option value="today">Heute</option>
              <option value="this-week">Diese Woche</option>
              <option value="this-month">Dieser Monat</option>
            </select>
          </div>
          <div className="history-list">
            {timeEntries.slice(0, 10).map((entry, index) => (
              <div key={index} className="history-item">
                <div className="history-date">{entry.date || 'Heute'}</div>
                <div className="history-time">
                  {entry.clock_in} - {entry.clock_out || 'läuft...'}
                </div>
                <div className="history-duration">
                  {entry.duration || '0:00:00'}
                </div>
                <div className="history-location">
                  {entry.location || 'Standort'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    return (
      <div className="orders-content">
        <h2>Meine Aufträge</h2>
        
        <div className="orders-stats-overview">
          <div className="stat-card">
            <h3>Offen</h3>
            <div className="stat-number">{orderStatsData?.open || 2}</div>
          </div>
          <div className="stat-card">
            <h3>Erledigt</h3>
            <div className="stat-number">{orderStatsData?.completed || 1}</div>
          </div>
          <div className="stat-card">
            <h3>Gesamt</h3>
            <div className="stat-number">{orderStatsData?.total || 3}</div>
          </div>
        </div>

        <div className="orders-filters">
          <select defaultValue="all">
            <option value="all">Alle Aufträge</option>
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
        </div>

        <div className="orders-list">
          {ordersData.map((order) => (
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
                <p><strong>Standort:</strong> {order.location}</p>
                <p><strong>Art:</strong> {getOrderTypeLabel(order.order_type)}</p>
                <p><strong>Startzeit:</strong> {order.start_time}</p>
                <p><strong>Beschreibung:</strong> {order.description}</p>
              </div>
              
              <div className="order-actions">
                <button 
                  onClick={() => handleOrderStatusChange(order.id, 'in_progress')}
                  className="action-btn start"
                  disabled={order.status !== 'assigned'}
                >
                  Starten
                </button>
                <button 
                  onClick={() => handleOrderStatusChange(order.id, 'completed')}
                  className="action-btn complete"
                  disabled={order.status === 'completed'}
                >
                  Abschließen
                </button>
                <button 
                  onClick={() => openNavigation(order.coordinates)}
                  className="action-btn navigate"
                >
                  Navigation
                </button>
                <button 
                  className="action-btn details"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="orders-summary">
          <h3>Auftrags-Zusammenfassung</h3>
          <div className="summary-stats">
            <div className="summary-stat">
              <span>Wartung:</span>
              <span>{orderStatsData?.byType?.maintenance?.open || 1} offen, {orderStatsData?.byType?.maintenance?.total || 1} gesamt</span>
            </div>
            <div className="summary-stat">
              <span>Reparatur:</span>
              <span>{orderStatsData?.byType?.repair?.open || 1} offen, {orderStatsData?.byType?.repair?.total || 1} gesamt</span>
            </div>
            <div className="summary-stat">
              <span>Installation:</span>
              <span>{orderStatsData?.byType?.installation?.open || 0} offen, {orderStatsData?.byType?.installation?.total || 1} gesamt</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="profile-content">
      <h2>Profil</h2>
      
      <div className="profile-info">
        <div className="profile-card">
          <h3>Persönliche Daten</h3>
          <div className="info-item">
            <span className="label">Name:</span>
            <span className="value">{user.name}</span>
          </div>
          <div className="info-item">
            <span className="label">E-Mail:</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="label">Rolle:</span>
            <span className="value">{user.role}</span>
          </div>
        </div>
        
        <div className="profile-card">
          <h3>Arbeitszeit-Statistiken</h3>
          <div className="info-item">
            <span className="label">Heute:</span>
            <span className="value">{formatDuration(getCurrentWorkTime())}</span>
          </div>
          <div className="info-item">
            <span className="label">Diese Woche:</span>
            <span className="value">32h 15m</span>
          </div>
          <div className="info-item">
            <span className="label">Überstunden:</span>
            <span className="value">+2h 30m</span>
          </div>
        </div>
      </div>
      
      <div className="profile-actions">
        <button onClick={onLogout} className="logout-btn">
          Abmelden
        </button>
      </div>
    </div>
  );

  return (
    <div className="monteur-dashboard">
      {/* Global Header - Top Menu Bar */}
      <header className="global-header">
        <div className="top-menu-bar">
          <div className="header-left">
            <div className="logo-container">
              <div className="logo-text">LA</div>
              <h1 className="header-title">Lackner Aufzüge</h1>
            </div>
          </div>
          
          <div className="header-center">
            <div className="current-datetime">
              <div className="current-date">{formatDate(currentTime)}</div>
              <div className="current-time">{formatTime(currentTime)}</div>
            </div>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button onClick={onLogout} className="header-logout-btn">
              Abmelden
            </button>
          </div>
        </div>
        
        {/* Bottom Navigation Bar */}
        <nav className="bottom-nav-bar">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"/>
            </svg>
            Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'time-tracking' ? 'active' : ''}`}
            onClick={() => setActiveTab('time-tracking')}
          >
            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Zeiterfassung
          </button>
          <button 
            className={`nav-btn ${activeTab === 'work-time' ? 'active' : ''}`}
            onClick={() => setActiveTab('work-time')}
          >
            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Arbeitszeit
          </button>
          <button 
            className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2M9 17H7a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v6a4 4 0 01-4 4h-2M9 17v2a2 2 0 002 2h2a2 2 0 002-2v-2"/>
            </svg>
            Aufträge
          </button>
          <button 
            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Profil
          </button>
        </nav>
      </header>

      <div className="dashboard-body">
        <main className="dashboard-main">
          {loading && <div className="loading">Lade...</div>}
          
          {!loading && (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'time-tracking' && renderTimeTracking()}
              {activeTab === 'work-time' && renderWorkTime()}
              {activeTab === 'orders' && renderOrders()}
              {activeTab === 'profile' && renderProfile()}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default MonteurDashboard;
