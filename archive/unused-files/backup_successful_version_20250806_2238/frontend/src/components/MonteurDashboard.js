import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ArbeitszeitEingabe from './ArbeitszeitEingabe';
import './MonteurDashboard.css';

// API Base URL für Production/Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

const MonteurDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
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
  const [message, setMessage] = useState(''); // Neue State für Nachrichten

  // State für Arbeitszeit-Seite
  const [workTimeFilter, setWorkTimeFilter] = useState('all');
  const [timeEntriesFilter, setTimeEntriesFilter] = useState('all');
  const [editingEntryId, setEditingEntryId] = useState(null);
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

  const handleEditTimeEntry = (entryId) => {
    setEditingEntryId(entryId);
    // Hier könnte ein Modal oder eine Bearbeitungsansicht geöffnet werden
    console.log('Bearbeite Zeiteintrag:', entryId);
  };

  const loadOrdersData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/orders`);
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

  // Arbeitszeit-Funktionen
  const getCurrentWorkTime = () => {
    if (!currentStatus?.is_working) return 0;
    
    const startTime = new Date(currentStatus.clock_in);
    const now = new Date();
    return Math.floor((now - startTime) / 1000);
  };

  const getWeeklyWorkTime = () => {
    if (!timeEntries.length) return '0h';
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.clock_in);
      return entryDate >= weekStart && entry.total_hours;
    });
    
    const totalHours = weekEntries.reduce((sum, entry) => sum + entry.total_hours, 0);
    return `${totalHours.toFixed(1)}h`;
  };

  const getOvertime = () => {
    if (!timeEntries.length) return '0h';
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.clock_in);
      return entryDate >= weekStart && entry.total_hours;
    });
    
    const totalHours = weekEntries.reduce((sum, entry) => sum + entry.total_hours, 0);
    const regularHours = weekEntries.length * 8; // 8h pro Tag
    const overtime = Math.max(0, totalHours - regularHours);
    
    return `${overtime.toFixed(1)}h`;
  };

  const getMealAllowance = () => {
    if (!timeEntries.length) return '0 Tage';
    
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.clock_in);
      return entryDate >= monthStart && entry.total_hours >= 8;
    });
    
    return `${monthEntries.length} Tage`;
  };

  const getWorkWarning = () => {
    if (!currentStatus?.is_working) return null;
    
    const currentHours = getCurrentWorkTime() / 3600;
    
    if (currentHours > 10) {
      return { type: 'error', message: 'Arbeitszeit über 10h - sofortige Beendigung erforderlich!' };
    } else if (currentHours > 8.5) {
      return { type: 'warning', message: 'Arbeitszeit über 8,5h - Überstundenantrag erforderlich!' };
    } else if (currentHours > 8) {
      return { type: 'info', message: 'Arbeitszeit über 8h - Überstunden möglich' };
    }
    
    return null;
  };

  // Zeiterfassung-Funktionen
    const handleClockIn = async () => {
        try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/clock-in`, {
        location: 'Standort'
      });
      
      if (response.data.success) {
        setMessage(response.data.message);
        loadCurrentStatus();
        loadTimeEntries();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Einstempeln');
        }
    };

    const handleClockOut = async () => {
        try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/clock-out`, {
        notes: 'Ausgestempelt'
      });
      
      if (response.data.success) {
        setMessage(response.data.message);
        if (response.data.warnings?.length > 0) {
          setMessage(`${response.data.message} - Warnungen: ${response.data.warnings.join(', ')}`);
        }
        if (response.data.errors?.length > 0) {
          setMessage(`Fehler: ${response.data.errors.join(', ')}`);
        }
        loadCurrentStatus();
        loadTimeEntries();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Ausstempeln');
    }
  };

  const handleBreakStart = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/break-start`);
      
      if (response.data.success) {
        setMessage(response.data.message);
        loadCurrentStatus();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Pausenstart');
    }
  };

  const handleBreakEnd = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/break-end`);
      
      if (response.data.success) {
        setMessage(response.data.message);
        loadCurrentStatus();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Pausenende');
    }
  };

  const handleManualTimeEntry = async (entryData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/monteur/time-entries`, entryData);
      
      if (response.data.success) {
        setMessage('Zeiteintrag erfolgreich erstellt');
        loadTimeEntries();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Erstellen des Zeiteintrags');
    }
  };

  const handleUpdateTimeEntry = async (entryId, updateData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/monteur/time-entries/${entryId}`, updateData);
      
      if (response.data.success) {
        setMessage('Zeiteintrag erfolgreich aktualisiert');
        loadTimeEntries();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Aktualisieren des Zeiteintrags');
    }
  };

  const handleDeleteTimeEntry = async (entryId) => {
    if (!window.confirm('Zeiteintrag wirklich löschen?')) return;
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/monteur/time-entries/${entryId}`);
      
      if (response.data.success) {
        setMessage('Zeiteintrag erfolgreich gelöscht');
        loadTimeEntries();
      } else {
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage('Fehler beim Löschen des Zeiteintrags');
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

  // ManualTimeEntryForm Component
  const ManualTimeEntryForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      breakTime: 0,
      location: '',
      notes: '',
      workType: 'regular'
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const workTypeOptions = [
      { value: 'regular', label: 'Reguläre Arbeit', icon: '🏢' },
      { value: 'overtime', label: 'Überstunden', icon: '⏰' },
      { value: 'sick', label: 'Krankheit', icon: '🏥' },
      { value: 'vacation', label: 'Urlaub', icon: '🏖️' },
      { value: 'training', label: 'Schulung', icon: '📚' },
      { value: 'travel', label: 'Dienstreise', icon: '🚗' },
      { value: 'other', label: 'Sonstiges', icon: '📝' }
    ];

    const breakTimeOptions = [
      { value: 0, label: 'Keine Pause' },
      { value: 15, label: '15 Minuten' },
      { value: 30, label: '30 Minuten' },
      { value: 45, label: '45 Minuten' },
      { value: 60, label: '1 Stunde' },
      { value: 90, label: '1,5 Stunden' }
    ];

    const validateForm = () => {
      const newErrors = {};

      if (!formData.startTime) {
        newErrors.startTime = 'Startzeit ist erforderlich';
      }
      if (!formData.endTime) {
        newErrors.endTime = 'Endzeit ist erforderlich';
      }
      if (formData.startTime && formData.endTime) {
        const start = new Date(`2000-01-01T${formData.startTime}`);
        const end = new Date(`2000-01-01T${formData.endTime}`);
        if (start >= end) {
          newErrors.endTime = 'Endzeit muss nach Startzeit liegen';
        }
        
        // Arbeitszeit berechnen
        const workDuration = (end - start) / (1000 * 60 * 60); // Stunden
        const netWorkHours = workDuration - (formData.breakTime / 60);
        
        if (netWorkHours > 10) {
          newErrors.workTime = 'Arbeitszeit über 10h ist gesetzlich verboten';
        } else if (netWorkHours > 8.5) {
          newErrors.workTime = 'Arbeitszeit über 8,5h erfordert Überstundenantrag';
        } else if (netWorkHours > 6 && formData.breakTime < 30) {
          newErrors.breakTime = 'Bei über 6h Arbeit ist mindestens 30min Pause erforderlich';
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!validateForm()) return;
      
      setIsSubmitting(true);
      
      try {
        const entryData = {
          clock_in: `${formData.date}T${formData.startTime}:00`,
          clock_out: `${formData.date}T${formData.endTime}:00`,
          location: formData.location,
          notes: formData.notes,
          work_type: formData.workType
        };
        
        if (formData.breakTime > 0) {
          const startTime = new Date(`2000-01-01T${formData.startTime}`);
          const breakStart = new Date(startTime.getTime() + (formData.breakTime * 60 * 1000 / 2));
          const breakEnd = new Date(breakStart.getTime() + (formData.breakTime * 60 * 1000));
          
          entryData.break_start = `${formData.date}T${breakStart.toTimeString().slice(0, 5)}:00`;
          entryData.break_end = `${formData.date}T${breakEnd.toTimeString().slice(0, 5)}:00`;
        }
        
        await onSubmit(entryData);
        
        // Form zurücksetzen
        setFormData({
          date: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: '',
          breakTime: 0,
          location: '',
          notes: '',
          workType: 'regular'
        });
      } catch (error) {
        console.error('Fehler beim Erstellen des Zeiteintrags:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="manual-entry-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Datum *</label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
            </div>

          <div className="form-group">
            <label htmlFor="workType">Arbeitszeit-Typ *</label>
            <select
              id="workType"
              value={formData.workType}
              onChange={(e) => setFormData({...formData, workType: e.target.value})}
              required
            >
              {workTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
                                </div>
                                </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startTime">Startzeit *</label>
            <input
              type="time"
              id="startTime"
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              required
              className={errors.startTime ? 'error' : ''}
            />
            {errors.startTime && <span className="error-message">{errors.startTime}</span>}
                                </div>
          
          <div className="form-group">
            <label htmlFor="endTime">Endzeit *</label>
            <input
              type="time"
              id="endTime"
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              required
              className={errors.endTime ? 'error' : ''}
            />
            {errors.endTime && <span className="error-message">{errors.endTime}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="breakTime">Pause</label>
            <select
              id="breakTime"
              value={formData.breakTime}
              onChange={(e) => setFormData({...formData, breakTime: parseInt(e.target.value)})}
              className={errors.breakTime ? 'error' : ''}
            >
              {breakTimeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.breakTime && <span className="error-message">{errors.breakTime}</span>}
                                </div>
                            </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location">Standort</label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Standort eingeben"
            />
                    </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notizen</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Optionale Notizen..."
              rows="3"
            />
                    </div>
                    </div>

        {errors.workTime && (
          <div className="work-time-warning">
            ⚠️ {errors.workTime}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Speichere...' : 'Zeiteintrag speichern'}
                        </button>
        </div>
      </form>
    );
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
                {currentStatus?.is_working ? 'Arbeitet' : 'Nicht eingestempelt'}
              </div>
              <div className="work-controls">
                {!currentStatus?.is_working ? (
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
                <div className={`work-warning ${getWorkWarning().type}`}>⚠️ {getWorkWarning().message}</div>
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

  const renderTimeTracking = () => {
    const formatTime = (timeString) => {
      if (!timeString) return '-';
      const date = new Date(timeString);
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}:${minutes.toString().padStart(2, '0')}h`;
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE');
    };

                return (
      <div className="time-tracking-page">
        <div className="page-header">
          <h2>Zeiterfassung</h2>
          <p>Arbeitszeit erfassen und verwalten</p>
        </div>

        {/* Aktuelle Arbeitszeit */}
        <div className="current-work-section">
          <div className="current-work-card">
            <h3>Aktuelle Arbeitszeit</h3>
            <div className="current-work-display">
              <div className="work-time">
                <span className="time-label">Heute:</span>
                <span className="time-value">{formatDuration(getCurrentWorkTime())}</span>
              </div>
              <div className="work-status">
                <span className="status-label">Status:</span>
                <span className={`status-value ${currentStatus?.is_working ? 'working' : 'idle'}`}>
                  {currentStatus?.is_working ? 'Arbeitet' : 'Nicht eingestempelt'}
                </span>
              </div>
            </div>
            
            {currentStatus?.warnings?.length > 0 && (
              <div className="work-warnings">
                {currentStatus.warnings.map((warning, index) => (
                  <div key={index} className="warning-item">
                    ⚠️ {warning}
                  </div>
                ))}
              </div>
            )}

            <div className="work-controls">
              {!currentStatus?.is_working ? (
                <button onClick={handleClockIn} className="btn-primary">
                                            Einstempeln
                                        </button>
                                    ) : (
                <div className="work-controls-group">
                  <button onClick={handleClockOut} className="btn-danger">
                                            Ausstempeln
                                        </button>
                  {currentStatus?.break_status === 'no_break' ? (
                    <button onClick={handleBreakStart} className="btn-secondary">
                      Pause starten
                    </button>
                  ) : currentStatus?.break_status === 'on_break' ? (
                    <button onClick={handleBreakEnd} className="btn-secondary">
                      Pause beenden
                    </button>
                  ) : null}
                </div>
                                    )}
                                </div>
                            </div>
                            </div>

        {/* Manueller Zeiteintrag */}
        <div className="manual-entry-section">
          <div className="manual-entry-card">
            <h3>Manueller Zeiteintrag</h3>
            <ManualTimeEntryForm onSubmit={handleManualTimeEntry} />
                        </div>
                        </div>

        {/* Zeiteinträge Historie */}
        <div className="time-entries-section">
          <div className="time-entries-header">
            <h3>Zeiteinträge</h3>
            <div className="entries-filter">
              <select 
                value={timeEntriesFilter} 
                onChange={(e) => setTimeEntriesFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Alle Einträge</option>
                <option value="today">Heute</option>
                <option value="week">Diese Woche</option>
                <option value="month">Dieser Monat</option>
              </select>
            </div>
          </div>

          <div className="time-entries-list">
            {timeEntries.length === 0 ? (
              <div className="no-entries">
                <p>Keine Zeiteinträge vorhanden</p>
              </div>
            ) : (
              timeEntries.map(entry => (
                <div key={entry.id} className="time-entry-item">
                  <div className="entry-header">
                    <div className="entry-date">
                      {formatDate(entry.clock_in)}
                    </div>
                    <div className="entry-actions">
                      <button 
                        onClick={() => handleEditTimeEntry(entry.id)}
                        className="btn-edit"
                      >
                        Bearbeiten
                      </button>
                      <button 
                        onClick={() => handleDeleteTimeEntry(entry.id)}
                        className="btn-delete"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                  
                  <div className="entry-details">
                    <div className="entry-times">
                      <div className="time-item">
                        <span className="time-label">Einstempel:</span>
                        <span className="time-value">{formatTime(entry.clock_in)}</span>
                      </div>
                      <div className="time-item">
                        <span className="time-label">Ausstempel:</span>
                        <span className="time-value">{formatTime(entry.clock_out)}</span>
                      </div>
                      {entry.break_start && (
                        <div className="time-item">
                          <span className="time-label">Pause:</span>
                          <span className="time-value">
                            {formatTime(entry.break_start)} - {formatTime(entry.break_end)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="entry-duration">
                      {entry.clock_out ?
                        formatDuration((new Date(entry.clock_out) - new Date(entry.clock_in)) / 1000) :
                        'läuft...'
                      }
                    </div>
                    
                    <div className="entry-location">
                      {entry.location || 'Standort'}
                    </div>
                    
                    {entry.notes && (
                      <div className="entry-notes">
                        <span className="notes-label">Notizen:</span>
                        <span className="notes-value">{entry.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Arbeitszeit-Zusammenfassung */}
        <div className="time-summary-section">
          <div className="summary-header">
            <h3>Arbeitszeit-Zusammenfassung</h3>
          </div>
          
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-title">Heute</div>
              <div className="summary-value">{formatDuration(getCurrentWorkTime())}</div>
              <div className="summary-subtitle">Aktuelle Arbeitszeit</div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">Diese Woche</div>
              <div className="summary-value">{getWeeklyWorkTime()}</div>
              <div className="summary-subtitle">Gesamtarbeitszeit</div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">Überstunden</div>
              <div className="summary-value">{getOvertime()}</div>
              <div className="summary-subtitle">Diese Woche</div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">Verpflegungsmehraufwand</div>
              <div className="summary-value">{getMealAllowance()}</div>
              <div className="summary-subtitle">Dieser Monat</div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('Fehler') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
                    </div>
                );
  };

  const renderWorkTime = () => {
    return <ArbeitszeitEingabe />;
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
            <h3>In Bearbeitung</h3>
            <div className="stat-number">{orderStatsData?.in_progress || 1}</div>
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
          <select defaultValue="all" onChange={(e) => console.log('Filter changed:', e.target.value)}>
            <option value="all">Alle Aufträge</option>
            <option value="assigned">Zugewiesen</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="completed">Abgeschlossen</option>
          </select>
          <select defaultValue="all" onChange={(e) => console.log('Priority filter:', e.target.value)}>
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
                <p><strong>Kunde:</strong> {order.customer}</p>
                <p><strong>Beschreibung:</strong> {order.description}</p>
                <p><strong>Fällig:</strong> {formatDate(order.due_date)}</p>
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
                    <button onClick={() => { onLogout(); }} className="logout-btn">
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
                    <button onClick={() => { onLogout(); }} className="header-logout-btn">
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
