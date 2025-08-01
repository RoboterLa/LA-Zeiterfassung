import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const UrlaubPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tageUebrig: 25,
    tageVerbraucht: 5,
    tageGeplant: 3,
    antraegePending: 2
  });

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    urlaubsart: 'Urlaub',
    bemerkung: ''
  });

  const [urlaubsantraege, setUrlaubsantraege] = useState([
    {
      id: 1,
      title: 'Weihnachtsurlaub 2024',
      startDate: '23.12.2024',
      endDate: '27.12.2024',
      days: 5,
      submitted: '15.07.2024',
      status: 'Pending'
    }
  ]);

  const [naechsterUrlaub, setNaechsterUrlaub] = useState({
    title: 'Sommerurlaub 2024',
    startDate: '15.08.2024',
    endDate: '22.08.2024',
    days: 8,
    resturlaub: 17,
    status: 'Genehmigt'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Urlaubsantrag eingereicht:', formData);
  };

  const handleReset = () => {
    setFormData({
      startDate: '',
      endDate: '',
      urlaubsart: 'Urlaub',
      bemerkung: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        user={user} 
        pendingCount={stats.antraegePending}
        overtimeWarnings={[]}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Urlaubsverwaltung</h1>
          <p className="text-gray-600">Verwalten Sie Ihre Urlaubsanträge und -übersicht</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.tageUebrig}</div>
            <div className="text-sm text-gray-600">Tage übrig</div>
            <div className="text-xs text-gray-500">von 30 Tagen</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.tageVerbraucht}</div>
            <div className="text-sm text-gray-600">Tage verbraucht</div>
            <div className="text-xs text-gray-500">in diesem Jahr</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.tageGeplant}</div>
            <div className="text-sm text-gray-600">Tage geplant</div>
            <div className="text-xs text-gray-500">für die Zukunft</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{stats.antraegePending}</div>
            <div className="text-sm text-gray-600">Anträge pending</div>
            <div className="text-xs text-gray-500">warten auf Genehmigung</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Neuer Urlaubsantrag */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-lg">+</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Neuer Urlaubsantrag</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urlaubsart</label>
                  <select
                    value={formData.urlaubsart}
                    onChange={(e) => setFormData({...formData, urlaubsart: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Urlaub">Urlaub</option>
                    <option value="Krankheit">Krankheit</option>
                    <option value="Feiertag">Feiertag</option>
                    <option value="Sonstiges">Sonstiges</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bemerkung</label>
                  <textarea
                    value={formData.bemerkung}
                    onChange={(e) => setFormData({...formData, bemerkung: e.target.value})}
                    placeholder="Optionale Bemerkung..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <span className="mr-2">📤</span>
                    Antrag einreichen
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center"
                  >
                    <span className="mr-2">🔄</span>
                    Zurücksetzen
                  </button>
                </div>
              </form>
            </div>

            {/* Meine Urlaubsanträge */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-lg">📋</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Meine Urlaubsanträge</h2>
              </div>
              
              <div className="space-y-3">
                {urlaubsantraege.map((antrag) => (
                  <div key={antrag.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{antrag.title}</h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        {antrag.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {antrag.startDate} - {antrag.endDate}
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      {antrag.days} Tage - Eingereicht: {antrag.submitted}
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                        Bearbeiten
                      </button>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                        Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Nächster Urlaub */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-lg">📁</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Nächster Urlaub</h2>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-blue-900">{naechsterUrlaub.title}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {naechsterUrlaub.status}
                  </span>
                </div>
                <div className="text-sm text-blue-700 mb-1">
                  {naechsterUrlaub.startDate} - {naechsterUrlaub.endDate}
                </div>
                <div className="text-sm text-blue-600">
                  {naechsterUrlaub.days} Tage Urlaub - Resturlaub: {naechsterUrlaub.resturlaub} Tage
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Urlaubsübersicht 2024</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Gesamturlaub:</span>
                    <span className="font-medium">30 Tage</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verbraucht:</span>
                    <span className="font-medium">{stats.tageVerbraucht} Tage</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Geplant:</span>
                    <span className="font-medium">{stats.tageGeplant} Tage</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Übrig:</span>
                    <span className="font-medium">{stats.tageUebrig} Tage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">
              Alle
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium">
              Pending
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium">
              Genehmigt
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UrlaubPage; 