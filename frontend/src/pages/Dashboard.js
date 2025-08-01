import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ArbeitszeitTimer from '../components/ArbeitszeitTimer';

const Dashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats] = useState({
    auftraege: { total: 5, done: 2, pending: 3 },
    arbeitszeit: { today: "07:32", week: "32:15", overtime: "2:45" },
    urlaub: { remaining: 25, used: 5, planned: 3 }
  });

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Begrüßung */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Guten Tag, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Willkommen im Monteur-Dashboard von Lackner Aufzüge
        </p>
        <div className="mt-2 text-sm text-gray-500">
          {formatDate(currentTime)} • {formatTime(currentTime)}
        </div>
      </div>

      {/* Hauptbereich: Aufträge und Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Meine Aufträge */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📋</span>
              <h2 className="text-xl font-semibold text-gray-900">Meine Aufträge heute</h2>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Alle Aufträge →
            </button>
          </div>
          
          {/* Auftrags-Statistiken */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.auftraege.done}</div>
              <div className="text-sm text-green-700">Erledigt</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.auftraege.pending}</div>
              <div className="text-sm text-gray-700">Offen</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">1</div>
              <div className="text-sm text-red-700">Notfall</div>
            </div>
          </div>

          {/* Auftragsliste */}
          <div className="space-y-3">
            {/* Notfall-Auftrag */}
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-red-900">08:30 - Notfall</span>
                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">Notfall</span>
                  </div>
                  <div className="text-sm text-red-800 font-medium">Hauptbahnhof München</div>
                  <div className="text-xs text-red-700 mt-1">Aufzug klemmt, Notruf ausgelöst</div>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                    🗺️ Navigation
                  </button>
                  <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700">
                    ✅ Erledigt
                  </button>
                </div>
              </div>
            </div>

            {/* Normaler Auftrag */}
            <div className="p-4 bg-gray-50 border-l-4 border-gray-400 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">09:15 - Wartung</span>
                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">Offen</span>
                  </div>
                  <div className="text-sm text-gray-800 font-medium">Sendlinger Tor, München</div>
                  <div className="text-xs text-gray-700 mt-1">Regelmäßige Wartung, Ölwechsel</div>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                    🗺️ Navigation
                  </button>
                  <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700">
                    ✅ Erledigt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arbeitszeit Timer */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⏰</span>
              <h2 className="text-xl font-semibold text-gray-900">Arbeitszeit Timer</h2>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Alle Arbeitszeiten →
            </button>
          </div>
          
          <ArbeitszeitTimer />
        </div>
      </div>

      {/* Zweiter Bereich: Wetter, Wetterwarnungen, Urlaub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Wetter Widget */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🌤️</span>
              <h3 className="text-lg font-semibold">Wetter</h3>
            </div>
            <button className="text-white opacity-80 hover:opacity-100 text-sm">
              Detailliert →
            </button>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-3xl font-bold mb-2">18°C</div>
            <div className="text-sm opacity-90">Leicht bewölkt</div>
            <div className="text-xs opacity-75 mt-1">Gefühlt: 16°C</div>
          </div>

          <div className="border-t border-white border-opacity-20 pt-4">
            <div className="text-sm font-medium mb-3">3-Tage-Forecast</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">☀️</span>
                  <span className="text-sm">Heute</span>
                </div>
                <span className="text-sm font-bold">20°C</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">☁️</span>
                  <span className="text-sm">Morgen</span>
                </div>
                <span className="text-sm font-bold">17°C</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">🌧️</span>
                  <span className="text-sm">Übermorgen</span>
                </div>
                <span className="text-sm font-bold">15°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wetterwarnungen */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <h3 className="text-lg font-semibold text-gray-900">Wetterwarnungen</h3>
            </div>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
              DWD prüfen →
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-yellow-800">Starkregen</span>
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Aktiv</span>
              </div>
              <div className="text-xs text-yellow-700">München - 14:00 bis 18:00 Uhr</div>
            </div>
            
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Keine Warnungen</span>
              </div>
              <div className="text-xs text-gray-600">Letzte Prüfung: vor 5 Min.</div>
            </div>
          </div>
        </div>

        {/* Urlaub */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏖️</span>
              <h3 className="text-lg font-semibold text-gray-900">Urlaub</h3>
            </div>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
              Übersicht →
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.urlaub.remaining}</div>
              <div className="text-xs text-gray-600">Übrig</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.urlaub.used}</div>
              <div className="text-xs text-gray-600">Verbraucht</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.urlaub.planned}</div>
              <div className="text-xs text-gray-600">Geplant</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded text-sm">
              <div className="font-medium text-blue-900">Nächster Urlaub</div>
              <div className="text-blue-700">15.08. - 22.08.2024</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tageszusammenfassung */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">📊</span>
          <h2 className="text-xl font-semibold text-gray-900">Tageszusammenfassung</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200 cursor-pointer hover:shadow-md transition-all">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">3</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Benachrichtigungen</div>
              <div className="text-xs text-gray-600 mb-2">2 neue, 1 Überstunden</div>
              <div className="text-xs text-blue-600 font-medium">→ Zur Genehmigung</div>
            </div>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200 cursor-pointer hover:shadow-md transition-all">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">1</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Notfälle</div>
              <div className="text-xs text-gray-600 mb-2">Hauptbahnhof München</div>
              <div className="text-xs text-blue-600 font-medium">→ Zu den Aufträgen</div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 cursor-pointer hover:shadow-md transition-all">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Offene Aufgaben</div>
              <div className="text-xs text-gray-600 mb-2">Zeiteinträge warten</div>
              <div className="text-xs text-blue-600 font-medium">→ Zur Zeiterfassung</div>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200 cursor-pointer hover:shadow-md transition-all">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.urlaub.remaining}</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Urlaubstage</div>
              <div className="text-xs text-gray-600 mb-2">{stats.urlaub.remaining} übrig, {stats.urlaub.planned} geplant</div>
              <div className="text-xs text-blue-600 font-medium">→ Zum Urlaub</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 