import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ArbeitszeitTimer from '../components/ArbeitszeitTimer';

const Dashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
    user: user,
    dashboard_data: {
      stoerungen: [],
      auftraege: [
        {
          id: '1',
          art: 'Reparatur',
          uhrzeit: '07:30',
          standort: 'Hauptbahnhof, München',
          coords: [48.1402, 11.5586],
          details: 'Aufzug klemmt, Notruf ausgelöst.',
          done: false
        },
        {
          id: '2',
          art: 'Wartung',
          uhrzeit: '08:15',
          standort: 'Sendlinger Tor, München',
          coords: [48.1325, 11.5674],
          details: 'Regelmäßige Wartung, Ölwechsel.',
          done: false
        }
      ],
      heutige_arbeitszeit: [],
      urlaub: [],
      offene_zeiteintraege: [],
      letzte_zeiteintraege: [],
      auftraege_offen: 2,
      auftraege_erledigt: 0,
      auftragsarten: {},
      naechster_auftrag_uhrzeit: '07:30',
      naechster_auftrag_art: 'Reparatur',
      naechster_auftrag_standort: 'Hauptbahnhof, München',
      naechster_auftrag_coords: [48.1402, 11.5586],
      verbleibende_zeit: '2:30h',
      pending_count: 0,
      resturlaub: 30
    }
  });

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        pendingCount={dashboardData.dashboard_data.pending_count}
        overtimeWarnings={[]}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {getGreeting()}, {user?.name || 'Monteur'}!
                </h1>
                <p className="text-blue-100 text-lg">
                  Willkommen im Zeiterfassungssystem
                </p>
                <p className="text-blue-200 mt-2">
                  {formatDate(currentTime)} • {formatTime(currentTime)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold mb-1">
                  {dashboardData.dashboard_data.auftraege_offen}
                </div>
                <div className="text-blue-200">Offene Aufträge</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Heute gearbeitet</p>
                <p className="text-2xl font-bold text-gray-900">7:32h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aufträge erledigt</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.dashboard_data.auftraege_erledigt}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Überstunden</p>
                <p className="text-2xl font-bold text-gray-900">2:45h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urlaubstage</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.dashboard_data.resturlaub}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Meine Aufträge heute */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Meine Aufträge heute</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {dashboardData.dashboard_data.auftraege_offen} offen
                </span>
              </div>
              
              <div className="space-y-4">
                {dashboardData.dashboard_data.auftraege.map((auftrag) => (
                  <div key={auftrag.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          auftrag.art === 'Reparatur' ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{auftrag.art}</h3>
                          <p className="text-sm text-gray-600">{auftrag.uhrzeit} Uhr</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{auftrag.standort}</div>
                        <div className="text-xs text-gray-500">Koordinaten: {auftrag.coords.join(', ')}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{auftrag.details}</p>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        auftrag.done ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {auftrag.done ? 'Erledigt' : 'Offen'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Details anzeigen →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arbeitszeit Timer */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Arbeitszeit Timer</h2>
              <ArbeitszeitTimer />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Tageszusammenfassung */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tageszusammenfassung</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Arbeitszeit heute</span>
                  <span className="font-semibold">7:32h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pausenzeit</span>
                  <span className="font-semibold">0:45h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Überstunden</span>
                  <span className="font-semibold text-yellow-600">2:45h</span>
                </div>
                <hr className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nächster Auftrag</span>
                  <span className="font-semibold">{dashboardData.dashboard_data.naechster_auftrag_uhrzeit}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {dashboardData.dashboard_data.naechster_auftrag_art} • {dashboardData.dashboard_data.naechster_auftrag_standort}
                </div>
              </div>
            </div>

            {/* Wetter */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-md p-6 text-white">
              <h2 className="text-xl font-bold mb-4">Wetter</h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">22°C</div>
                  <div className="text-blue-100">Sonnig</div>
                  <div className="text-sm text-blue-200">München</div>
                </div>
                <div className="text-6xl">☀️</div>
              </div>
            </div>

            {/* Wetterwarnungen */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Wetterwarnungen</h2>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-yellow-800">Gewitterwarnung</div>
                    <div className="text-sm text-yellow-600">Heute Nachmittag</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-orange-800">Sturmwarnung</div>
                    <div className="text-sm text-orange-600">Morgen Vormittag</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Urlaub */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Urlaub</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Verbleibend</span>
                  <span className="font-semibold">{dashboardData.dashboard_data.resturlaub} Tage</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Genommen</span>
                  <span className="font-semibold">5 Tage</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Geplant</span>
                  <span className="font-semibold">8 Tage</span>
                </div>
                <hr className="my-3" />
                <div className="text-sm text-gray-600">
                  Nächster Urlaub: 15.08.2024 - 22.08.2024
                </div>
              </div>
            </div>

            {/* Zeiteinträge */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Letzte Zeiteinträge</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Wartung</div>
                    <div className="text-sm text-gray-600">Hauptbahnhof München</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">08:00 - 12:30</div>
                    <div className="text-sm text-gray-600">4:30h</div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Reparatur</div>
                    <div className="text-sm text-gray-600">Sendlinger Tor</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">13:00 - 16:00</div>
                    <div className="text-sm text-gray-600">3:00h</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Heutige Aktivitäten */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Heutige Aktivitäten</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Arbeitszeit gestartet</div>
                    <div className="text-xs text-gray-500">07:30 Uhr</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Auftrag angenommen</div>
                    <div className="text-xs text-gray-500">08:15 Uhr</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Pause</div>
                    <div className="text-xs text-gray-500">12:00 Uhr</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 