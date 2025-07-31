import React, { useState } from 'react';

const BueroPage = () => {
  const [stats] = useState({
    totalEmployees: 12,
    activeEmployees: 8,
    pendingApprovals: 5,
    totalHours: 320
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Büro-Verwaltung</h1>
        <p className="text-gray-600">Administrative Übersicht für Lackner Aufzüge</p>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalEmployees}</div>
          <div className="text-sm text-gray-600">Gesamt Mitarbeiter</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.activeEmployees}</div>
          <div className="text-sm text-gray-600">Aktive Mitarbeiter</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pendingApprovals}</div>
          <div className="text-sm text-gray-600">Ausstehende Genehmigungen</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalHours}</div>
          <div className="text-sm text-gray-600">Gesamtstunden diese Woche</div>
        </div>
      </div>

      {/* Verwaltungsbereiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mitarbeiter-Verwaltung */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <span className="text-2xl mr-3">👥</span>
            <h2 className="text-xl font-semibold text-gray-900">Mitarbeiter-Verwaltung</h2>
          </div>
          
          <div className="space-y-4">
            <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              + Neuen Mitarbeiter hinzufügen
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              👥 Alle Mitarbeiter anzeigen
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              📊 Mitarbeiter-Statistiken
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              🔐 Berechtigungen verwalten
            </button>
          </div>
        </div>

        {/* Genehmigungen */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <span className="text-2xl mr-3">✅</span>
            <h2 className="text-xl font-semibold text-gray-900">Genehmigungen</h2>
          </div>
          
          <div className="space-y-4">
            <button className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors">
              ⏳ Ausstehende Genehmigungen ({stats.pendingApprovals})
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              📋 Urlaubsanträge
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              ⏰ Überstunden-Genehmigungen
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              📊 Genehmigungs-Historie
            </button>
          </div>
        </div>

        {/* Auftrags-Verwaltung */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <span className="text-2xl mr-3">📋</span>
            <h2 className="text-xl font-semibold text-gray-900">Auftrags-Verwaltung</h2>
          </div>
          
          <div className="space-y-4">
            <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              + Neuen Auftrag erstellen
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              📋 Alle Aufträge anzeigen
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              🚨 Notfall-Aufträge
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              📊 Auftrags-Statistiken
            </button>
          </div>
        </div>

        {/* Berichte */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <span className="text-2xl mr-3">📊</span>
            <h2 className="text-xl font-semibold text-gray-900">Berichte & Export</h2>
          </div>
          
          <div className="space-y-4">
            <button className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              📊 Arbeitszeit-Bericht
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              📈 Überstunden-Report
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              📋 Urlaubs-Übersicht
            </button>
            
            <button className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              💾 Daten exportieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BueroPage; 