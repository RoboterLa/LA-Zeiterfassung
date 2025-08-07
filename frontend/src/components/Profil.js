import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profil.css';

// API Base URL - Production vs Development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://zeiterfassung-app-1754516418.azurewebsites.net' 
  : 'http://localhost:8080';

const Profil = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profil-Daten
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Monteur',
    email: user?.email || 'monteur@example.com',
    phone: '',
    address: '',
    employee_id: 'MON-001',
    department: 'Technik',
    position: 'Monteur',
    hire_date: '2023-01-15',
    supervisor: 'Max Mustermann',
    emergency_contact: '',
    skills: ['Aufzugwartung', 'Reparatur', 'Installation'],
    certifications: ['Aufzugtechniker', 'Sicherheitsschulung'],
    notes: ''
  });

  // Statistiken
  const [stats, setStats] = useState({
    totalWorkHours: 0,
    totalOrders: 0,
    completedOrders: 0,
    averageRating: 0,
    overtimeHours: 0,
    vacationDays: 25,
    sickDays: 0,
    mealAllowance: 0
  });

  // Einstellungen
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      shareLocation: true,
      shareStats: false,
      publicProfile: false
    },
    preferences: {
      language: 'de',
      timezone: 'Europe/Berlin',
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      theme: 'auto'
    }
  });

  // Lade Daten beim Start
  useEffect(() => {
    loadProfileData();
    loadStats();
  }, []);

  /**
   * Lädt Profil-Daten vom Server
   */
  const loadProfileData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/profile`, {
        withCredentials: true
      });
      if (response.data.success) {
        setProfileData(response.data.profile);
      }
    } catch (error) {
      setMessage('Fehler beim Laden der Profil-Daten');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lädt Statistiken vom Server
   */
  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monteur/profile-stats`, {
        withCredentials: true
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      // Verwende Mock-Daten bei Fehler
      setStats({
        totalWorkHours: 1247.5,
        totalOrders: 156,
        completedOrders: 142,
        averageRating: 4.8,
        overtimeHours: 23.5,
        vacationDays: 25,
        sickDays: 2,
        mealAllowance: 45
      });
    }
  };

  /**
   * Handler für Eingabe-Änderungen im Profil
   */
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handler für Einstellungs-Änderungen
   */
  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  /**
   * Speichert Profil-Daten
   */
  const saveProfile = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/monteur/profile`,
        profileData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setMessage('Profil erfolgreich aktualisiert!');
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
   * Speichert Einstellungen
   */
  const saveSettings = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/monteur/settings`,
        settings,
        { withCredentials: true }
      );

      if (response.data.success) {
        setMessage('Einstellungen erfolgreich gespeichert!');
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
   * Handler für Logout
   */
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/logout`, {}, {
        withCredentials: true
      });
      onLogout();
    } catch (error) {
      // Trotzdem ausloggen bei Fehler
      onLogout();
    }
  };

  /**
   * Formatiert DateTime-String zu Datum
   */
  // const formatDate = (dateString) => {
  //   if (!dateString) return '-';
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString('de-DE');
  // };

  /**
   * Gibt die Benutzerrolle-Label zurück
   */
  const getRoleLabel = (role) => {
    const roleLabels = {
      'monteur': 'Monteur',
      'buero': 'Büro',
      'admin': 'Administrator'
    };
    return roleLabels[role] || role;
  };

  return (
    <div className="profil-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Profil</h1>
          <p>Verwalten Sie Ihre persönlichen Informationen und Einstellungen</p>
        </div>
        <button 
          className="btn btn-danger btn-large"
          onClick={handleLogout}
        >
          <span className="btn-icon">🚪</span>
          Abmelden
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.includes('Fehler') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            Profil
          </button>
          <button 
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span className="tab-icon">📊</span>
            Statistiken
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="tab-icon">⚙️</span>
            Einstellungen
          </button>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-avatar">
              <div className="avatar-circle">
                {profileData.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="profile-info">
              <h2>{profileData.name}</h2>
              <p className="profile-role">{getRoleLabel(user?.role)}</p>
              <p className="profile-id">ID: {profileData.employee_id}</p>
            </div>
          </div>

          <div className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">E-Mail *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="phone">Telefon</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Adresse</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="department">Abteilung</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={profileData.department}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={profileData.position}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="hire_date">Einstellungsdatum</label>
                <input
                  type="date"
                  id="hire_date"
                  name="hire_date"
                  value={profileData.hire_date}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="supervisor">Vorgesetzter</label>
                <input
                  type="text"
                  id="supervisor"
                  name="supervisor"
                  value={profileData.supervisor}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="emergency_contact">Notfallkontakt</label>
              <input
                type="text"
                id="emergency_contact"
                name="emergency_contact"
                value={profileData.emergency_contact}
                onChange={handleProfileChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notizen</label>
              <textarea
                id="notes"
                name="notes"
                value={profileData.notes}
                onChange={handleProfileChange}
                className="form-input"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={saveProfile}
                disabled={loading}
              >
                {loading ? 'Speichere...' : 'Profil speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalWorkHours}h</div>
                <div className="stat-label">Gesamt Arbeitsstunden</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalOrders}</div>
                <div className="stat-label">Gesamt Aufträge</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{stats.completedOrders}</div>
                <div className="stat-label">Abgeschlossene Aufträge</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{stats.averageRating}</div>
                <div className="stat-label">Durchschnittliche Bewertung</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-content">
                <div className="stat-value">{stats.overtimeHours}h</div>
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
                <div className="stat-value">{stats.mealAllowance}€</div>
                <div className="stat-label">Verpflegungsmehraufwand</div>
              </div>
            </div>
          </div>

          <div className="skills-section">
            <h3>Fähigkeiten & Zertifizierungen</h3>
            <div className="skills-grid">
              <div className="skills-group">
                <h4>Fähigkeiten</h4>
                <div className="skills-list">
                  {profileData.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="skills-group">
                <h4>Zertifizierungen</h4>
                <div className="skills-list">
                  {profileData.certifications.map((cert, index) => (
                    <span key={index} className="cert-tag">{cert}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="settings-section">
          <div className="settings-group">
            <h3>Benachrichtigungen</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">E-Mail Benachrichtigungen</span>
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Push-Benachrichtigungen</span>
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sms}
                    onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">SMS Benachrichtigungen</span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-group">
            <h3>Datenschutz</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.privacy.shareLocation}
                    onChange={(e) => handleSettingChange('privacy', 'shareLocation', e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Standort teilen</span>
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.privacy.shareStats}
                    onChange={(e) => handleSettingChange('privacy', 'shareStats', e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Statistiken teilen</span>
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.privacy.publicProfile}
                    onChange={(e) => handleSettingChange('privacy', 'publicProfile', e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">Öffentliches Profil</span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-group">
            <h3>Präferenzen</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label htmlFor="language">Sprache</label>
                <select
                  id="language"
                  value={settings.preferences.language}
                  onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                  className="form-input"
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="setting-item">
                <label htmlFor="timezone">Zeitzone</label>
                <select
                  id="timezone"
                  value={settings.preferences.timezone}
                  onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                  className="form-input"
                >
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="Europe/Vienna">Europe/Vienna</option>
                  <option value="Europe/Zurich">Europe/Zurich</option>
                </select>
              </div>
              <div className="setting-item">
                <label htmlFor="dateFormat">Datumsformat</label>
                <select
                  id="dateFormat"
                  value={settings.preferences.dateFormat}
                  onChange={(e) => handleSettingChange('preferences', 'dateFormat', e.target.value)}
                  className="form-input"
                >
                  <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div className="setting-item">
                <label htmlFor="timeFormat">Zeitformat</label>
                <select
                  id="timeFormat"
                  value={settings.preferences.timeFormat}
                  onChange={(e) => handleSettingChange('preferences', 'timeFormat', e.target.value)}
                  className="form-input"
                >
                  <option value="24h">24 Stunden</option>
                  <option value="12h">12 Stunden</option>
                </select>
              </div>
              <div className="setting-item">
                <label htmlFor="theme">Design</label>
                <select
                  id="theme"
                  value={settings.preferences.theme}
                  onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                  className="form-input"
                >
                  <option value="auto">Automatisch</option>
                  <option value="light">Hell</option>
                  <option value="dark">Dunkel</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn btn-primary"
              onClick={saveSettings}
              disabled={loading}
            >
              {loading ? 'Speichere...' : 'Einstellungen speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profil;
