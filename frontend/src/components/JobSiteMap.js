import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { sitesAPI } from '../services/api';

const JobSiteMap = ({ onSiteSelect }) => {
  const { user, isMonteur, isMeister, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await sitesAPI.getAll();
      if (response.data.success) {
        setSites(response.data.sites || []);
      }
    } catch (error) {
      console.error('Failed to load sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteClick = (site) => {
    setSelectedSite(site);
    onSiteSelect?.(site);
  };

  const getStatusColor = (site) => {
    // Simuliere verschiedene Status basierend auf site.id
    const statuses = ['active', 'pending', 'completed'];
    const status = statuses[site.id % 3];
    
    const colors = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'completed': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return colors[status] || colors['pending'];
  };

  const getStatusText = (site) => {
    const statuses = ['Aktiv', 'Ausstehend', 'Abgeschlossen'];
    return statuses[site.id % 3] || 'Unbekannt';
  };

  const getPriorityIcon = (site) => {
    // Simuliere Prioritäten basierend auf site.id
    const priorities = ['high', 'medium', 'low'];
    const priority = priorities[site.id % 3];
    
    const icons = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };
    
    return icons[priority] || '⚪';
  };

  const renderListView = () => (
    <div className="space-y-4">
      {sites.map(site => (
        <div
          key={site.id}
          onClick={() => handleSiteClick(site)}
          className={`
            p-4 border rounded-lg cursor-pointer transition-colors hover:shadow-md
            ${selectedSite?.id === site.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getPriorityIcon(site)}</span>
                <h3 className="text-lg font-semibold text-gray-800">{site.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(site)}`}>
                  {getStatusText(site)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                📍 {site.address}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Fabriknummer:</span> {site.factory_number || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Projekt:</span> {site.project_number || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Auftrag:</span> {site.order_number || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Typ:</span> Aufzug
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {site.latitude && site.longitude ? '📍 GPS verfügbar' : '📍 GPS fehlt'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMapView = () => (
    <div className="bg-gray-100 rounded-lg p-4 text-center">
      <div className="text-gray-500 mb-4">
        🗺️ Kartenansicht wird implementiert...
      </div>
      <div className="text-sm text-gray-400">
        Leaflet.js Integration für interaktive Karte
      </div>
      <div className="mt-4 p-3 bg-white rounded border">
        <h4 className="font-medium mb-2">Geplante Features:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Interaktive Karte mit OpenStreetMap</li>
          <li>• Standort-Marker für alle Aufträge</li>
          <li>• Routenplanung zum ausgewählten Standort</li>
          <li>• GPS-Navigation für Monteure</li>
          <li>• Status-Updates in Echtzeit</li>
        </ul>
      </div>
    </div>
  );

  const renderSiteDetails = () => {
    if (!selectedSite) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">{selectedSite.name}</h3>
          <button
            onClick={() => setSelectedSite(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Standort-Details</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Adresse:</span> {selectedSite.address}
              </div>
              <div>
                <span className="font-medium">Fabriknummer:</span> {selectedSite.factory_number || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Projektnummer:</span> {selectedSite.project_number || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Auftragsnummer:</span> {selectedSite.order_number || 'N/A'}
              </div>
              {selectedSite.latitude && selectedSite.longitude && (
                <div>
                  <span className="font-medium">Koordinaten:</span> {selectedSite.latitude}, {selectedSite.longitude}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Aktionen</h4>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                📋 Tagesbericht erstellen
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                🗺️ Navigation starten
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                📞 Kontakt aufrufen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Aufträge werden geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Auftragsliste</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📋 Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'map' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🗺️ Karte
            </button>
          </div>
        </div>
        
        {/* Statistiken */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {sites.filter(s => getStatusText(s) === 'Aktiv').length}
            </div>
            <div className="text-xs text-gray-600">Aktive Aufträge</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {sites.filter(s => getStatusText(s) === 'Ausstehend').length}
            </div>
            <div className="text-xs text-gray-600">Ausstehend</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {sites.filter(s => getStatusText(s) === 'Abgeschlossen').length}
            </div>
            <div className="text-xs text-gray-600">Abgeschlossen</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {viewMode === 'list' ? renderListView() : renderMapView()}
        </div>
        
        <div>
          {renderSiteDetails()}
        </div>
      </div>
    </div>
  );
};

export default JobSiteMap; 