import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { timeclockAPI, reportsAPI, notificationsAPI, dashboardAPI } from '../services/api';
import ArbeitszeitTimer from './ArbeitszeitTimer';

const Dashboard = () => {
  const { user, isMonteur, isMeister, isAdmin, isBuero } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [teamStatus, setTeamStatus] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Lade rollenspezifische Daten
      const promises = [];

      // Stats für alle
      promises.push(dashboardAPI.getStats());
      
      // Pending Approvals für Meister/Admin
      if (isMeister() || isAdmin()) {
        promises.push(dashboardAPI.getPendingApprovals());
      }
      
      // Team Status für Meister/Admin
      if (isMeister() || isAdmin()) {
        promises.push(dashboardAPI.getTeamStatus());
      }
      
      // Notifications für alle
      promises.push(notificationsAPI.getAll());

      const responses = await Promise.all(promises);
      
      if (responses[0]?.data?.success) {
        setStats(responses[0].data.stats);
      }
      
      if (isMeister() || isAdmin()) {
        if (responses[1]?.data?.success) {
          setPendingApprovals(responses[1].data.approvals);
        }
        if (responses[2]?.data?.success) {
          setTeamStatus(responses[2].data.team);
        }
      }
      
      if (responses[responses.length - 1]?.data?.success) {
        setNotifications(responses[responses.length - 1].data.notifications);
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const getRoleSpecificContent = () => {
    if (isMonteur()) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ArbeitszeitTimer />
          <MonteurWidgets />
        </div>
      );
    }
    
    if (isMeister()) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MeisterOverview />
          </div>
          <div>
            <ApprovalWidget />
          </div>
        </div>
      );
    }
    
    if (isAdmin()) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AdminOverview />
          </div>
          <div>
            <SystemWidget />
          </div>
        </div>
      );
    }
    
    if (isBuero()) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ArbeitszeitTimer />
          <BueroWidgets />
        </div>
      );
    }
    
    return <DefaultWidgets />;
  };

  // Monteur-spezifische Widgets
  const MonteurWidgets = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Schnellaktionen</h3>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Tagesbericht erstellen
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Urlaubsantrag
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Heute</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Arbeitszeit:</span>
            <span className="font-semibold">{stats?.today_hours || '0:00'}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Einheiten:</span>
            <span className="font-semibold">{stats?.today_units || '0'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Resturlaub:</span>
            <span className="font-semibold">{user?.vacation_days_remaining || 0} Tage</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Meister-spezifische Widgets
  const MeisterOverview = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Team-Übersicht</h3>
        <div className="space-y-4">
          {teamStatus.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-gray-600">{member.status}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{member.hours}h</div>
                <div className="text-sm text-gray-600">{member.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistiken</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats?.team_active || 0}</div>
            <div className="text-sm text-gray-600">Aktiv</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingApprovals.length}</div>
            <div className="text-sm text-gray-600">Ausstehend</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats?.team_avg_hours || 0}</div>
            <div className="text-sm text-gray-600">Ø Stunden</div>
          </div>
        </div>
      </div>
    </div>
  );

  const ApprovalWidget = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Freigaben</h3>
      <div className="space-y-3">
        {pendingApprovals.length > 0 ? (
          pendingApprovals.map(approval => (
            <div key={approval.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="font-medium text-sm">{approval.user_name}</div>
              <div className="text-xs text-gray-600">{approval.date}</div>
              <div className="text-xs text-gray-600">{approval.units} Einheiten</div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            Keine ausstehenden Freigaben
          </div>
        )}
      </div>
    </div>
  );

  // Admin-spezifische Widgets
  const AdminOverview = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System-Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats?.total_users || 0}</div>
            <div className="text-sm text-gray-600">Benutzer</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats?.active_sessions || 0}</div>
            <div className="text-sm text-gray-600">Aktive Sessions</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Aktivitäten</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Heute eingestempelt:</span>
            <span className="font-semibold">{stats?.today_clock_ins || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Berichte erstellt:</span>
            <span className="font-semibold">{stats?.today_reports || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Freigaben:</span>
            <span className="font-semibold">{stats?.today_approvals || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const SystemWidget = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">System</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Datenbank:</span>
          <span className="text-sm font-semibold text-green-600">Online</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">API:</span>
          <span className="text-sm font-semibold text-green-600">Aktiv</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Version:</span>
          <span className="text-sm font-semibold">v2.0</span>
        </div>
      </div>
    </div>
  );

  // Büro-spezifische Widgets
  const BueroWidgets = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Wochenübersicht</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Soll:</span>
            <span className="font-semibold">{user?.weekly_hours || 40}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ist:</span>
            <span className="font-semibold">{stats?.week_hours || 0}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Differenz:</span>
            <span className={`font-semibold ${(stats?.week_hours || 0) > (user?.weekly_hours || 40) ? 'text-red-600' : 'text-green-600'}`}>
              {((stats?.week_hours || 0) - (user?.weekly_hours || 40)).toFixed(1)}h
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Schnellaktionen</h3>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Urlaubsantrag
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Monatsbericht
          </button>
        </div>
      </div>
    </div>
  );

  // Default Widgets
  const DefaultWidgets = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Willkommen</h3>
      <p className="text-gray-600">Dashboard für Ihre Rolle wird geladen...</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            {new Date().toLocaleDateString('de-DE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Benachrichtigungen</h2>
            <div className="space-y-2">
              {notifications.slice(0, 3).map(notification => (
                <div key={notification.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-gray-600">{notification.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Role-specific Content */}
        {getRoleSpecificContent()}
      </div>
    </div>
  );
};

export default Dashboard; 