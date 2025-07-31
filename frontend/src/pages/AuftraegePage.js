import React, { useState, useEffect } from 'react';

const AuftraegePage = () => {
  const [auftraege, setAuftraege] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simuliere API-Call
    setTimeout(() => {
      setAuftraege([
        {
          id: 1,
          art: 'Notfall',
          uhrzeit: '08:30',
          standort: 'Hauptbahnhof München',
          details: 'Aufzug klemmt, Notruf ausgelöst',
          done: false,
          priority: 'high'
        },
        {
          id: 2,
          art: 'Wartung',
          uhrzeit: '09:15',
          standort: 'Sendlinger Tor, München',
          details: 'Regelmäßige Wartung, Ölwechsel',
          done: false,
          priority: 'normal'
        },
        {
          id: 3,
          art: 'Reparatur',
          uhrzeit: '10:30',
          standort: 'Karlsplatz, München',
          details: 'Türschließer defekt',
          done: true,
          priority: 'normal'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAuftraege = auftraege.filter(auftrag => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !auftrag.done;
    if (filter === 'done') return auftrag.done;
    if (filter === 'emergency') return auftrag.priority === 'high';
    return true;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (done) => {
    return done ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Aufträge...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Aufträge</h1>
        <p className="text-gray-600">Verwalten Sie Ihre Arbeitsaufträge und Aufgaben</p>
      </div>

      {/* Filter und Statistiken */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Alle ({auftraege.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Offen ({auftraege.filter(a => !a.done).length})
            </button>
            <button
              onClick={() => setFilter('done')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'done'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Erledigt ({auftraege.filter(a => a.done).length})
            </button>
            <button
              onClick={() => setFilter('emergency')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'emergency'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Notfälle ({auftraege.filter(a => a.priority === 'high').length})
            </button>
          </div>

          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            + Neuer Auftrag
          </button>
        </div>
      </div>

      {/* Auftragsliste */}
      <div className="space-y-4">
        {filteredAuftraege.map((auftrag) => (
          <div
            key={auftrag.id}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              auftrag.priority === 'high' ? 'border-red-500' : 'border-blue-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {auftrag.uhrzeit} - {auftrag.art}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(auftrag.priority)}`}>
                    {auftrag.priority === 'high' ? 'Notfall' : 'Normal'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(auftrag.done)}`}>
                    {auftrag.done ? 'Erledigt' : 'Offen'}
                  </span>
                </div>
                
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {auftrag.standort}
                </div>
                
                <div className="text-sm text-gray-600">
                  {auftrag.details}
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                  🗺️ Navigation
                </button>
                
                {!auftrag.done ? (
                  <button className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                    ✅ Erledigt
                  </button>
                ) : (
                  <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                    👁️ Details
                  </button>
                )}
                
                <button className="bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                  ✏️ Bearbeiten
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAuftraege.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">Keine Aufträge gefunden</div>
          <div className="text-gray-400 text-sm">
            {filter === 'all' 
              ? 'Erstellen Sie Ihren ersten Auftrag'
              : `Keine ${filter === 'pending' ? 'offenen' : filter === 'done' ? 'erledigten' : 'Notfall-'}Aufträge vorhanden`
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default AuftraegePage; 