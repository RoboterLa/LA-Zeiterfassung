import React, { useState } from 'react';

const ZeiterfassungPage = () => {
  const [timeEntries] = useState([
    {
      id: 1,
      date: '2024-01-15',
      startTime: '08:00',
      endTime: '16:30',
      location: 'Hauptbahnhof München',
      activityType: 'Wartung',
      duration: '8h 30min',
      status: 'completed'
    },
    {
      id: 2,
      date: '2024-01-15',
      startTime: '16:30',
      endTime: '18:45',
      location: 'Sendlinger Tor',
      activityType: 'Notdienst',
      duration: '2h 15min',
      status: 'completed'
    }
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zeiterfassung</h1>
        <p className="text-gray-600">Detaillierte Übersicht Ihrer Arbeitszeiten</p>
      </div>

      {/* Zeiterfassung-Einträge */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⏱️</span>
            <h2 className="text-xl font-semibold text-gray-900">Zeiterfassung-Einträge</h2>
          </div>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + Neuer Eintrag
          </button>
        </div>
        
        <div className="space-y-4">
          {timeEntries.map((entry) => (
            <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {entry.date} • {entry.startTime} - {entry.endTime}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Abgeschlossen
                    </span>
                  </div>
                  
                  <div className="text-lg font-semibold text-gray-900 mb-1">
                    {entry.location}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {entry.activityType} • {entry.duration}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                    👁️ Details
                  </button>
                  
                  <button className="bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                    ✏️ Bearbeiten
                  </button>
                  
                  <button className="bg-red-200 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-300 transition-colors">
                    🗑️ Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ZeiterfassungPage; 