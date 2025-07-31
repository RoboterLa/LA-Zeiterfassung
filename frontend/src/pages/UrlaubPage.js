import React, { useState } from 'react';

const UrlaubPage = () => {
  const [urlaubStats] = useState({
    remaining: 25,
    used: 5,
    planned: 3
  });

  const [urlaubEntries] = useState([
    {
      id: 1,
      startDate: '2024-08-15',
      endDate: '2024-08-22',
      days: 8,
      type: 'Urlaub',
      status: 'approved'
    },
    {
      id: 2,
      startDate: '2024-12-23',
      endDate: '2024-12-27',
      days: 5,
      type: 'Weihnachten',
      status: 'pending'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Urlaub</h1>
        <p className="text-gray-600">Verwalten Sie Ihre Urlaubsanträge und -tage</p>
      </div>

      {/* Urlaubsstatistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{urlaubStats.remaining}</div>
          <div className="text-sm text-gray-600">Urlaubstage übrig</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{urlaubStats.used}</div>
          <div className="text-sm text-gray-600">Urlaubstage verbraucht</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{urlaubStats.planned}</div>
          <div className="text-sm text-gray-600">Urlaubstage geplant</div>
        </div>
      </div>

      {/* Neuer Urlaubsantrag */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">📝</span>
          <h2 className="text-xl font-semibold text-gray-900">Neuer Urlaubsantrag</h2>
        </div>
        
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startdatum
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enddatum
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urlaubsart
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="urlaub">Urlaub</option>
              <option value="weihnachten">Weihnachten</option>
              <option value="krankheit">Krankheit</option>
              <option value="sonderurlaub">Sonderurlaub</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bemerkung
            </label>
            <input
              type="text"
              placeholder="Optionale Bemerkung..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Urlaubsantrag einreichen
            </button>
          </div>
        </form>
      </div>

      {/* Urlaubsanträge */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📋</span>
            <h2 className="text-xl font-semibold text-gray-900">Meine Urlaubsanträge</h2>
          </div>
          
          <div className="flex space-x-2">
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              Alle
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Genehmigt
            </button>
            <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors">
              Ausstehend
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {urlaubEntries.map((entry) => (
            <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(entry.startDate)} - {formatDate(entry.endDate)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>
                      {entry.status === 'approved' ? 'Genehmigt' : 
                       entry.status === 'pending' ? 'Ausstehend' : 'Abgelehnt'}
                    </span>
                  </div>
                  
                  <div className="text-lg font-semibold text-gray-900 mb-1">
                    {entry.type}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {entry.days} Tage • {entry.days * 8} Stunden
                  </div>
                </div>

                <div className="flex space-x-2">
                  {entry.status === 'pending' && (
                    <>
                      <button className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                        ✅ Genehmigen
                      </button>
                      <button className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors">
                        ❌ Ablehnen
                      </button>
                    </>
                  )}
                  
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

export default UrlaubPage; 