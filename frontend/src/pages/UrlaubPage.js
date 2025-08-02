import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { absencesAPI } from '../services/api';
import AbsenceRequestForm from '../components/AbsenceRequestForm';
import AbsenceCalendar from '../components/AbsenceCalendar';

const UrlaubPage = () => {
  const { user, isMonteur, isMeister, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [absenceRequests, setAbsenceRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  useEffect(() => {
    loadAbsenceRequests();
  }, []);

  const loadAbsenceRequests = async () => {
    try {
      const response = await absencesAPI.getAll();
      if (response.data.success) {
        setAbsenceRequests(response.data.absence_requests);
      }
    } catch (error) {
      console.error('Failed to load absence requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (absenceRequest) => {
    setAbsenceRequests(prev => [absenceRequest, ...prev]);
    setShowForm(false);
  };

  const handleAbsenceClick = (absence) => {
    setSelectedAbsence(absence);
  };

  const handleApprove = async (absenceId) => {
    try {
      await absencesAPI.approve(absenceId);
      await loadAbsenceRequests();
    } catch (error) {
      console.error('Failed to approve absence request:', error);
    }
  };

  const handleReject = async (absenceId, reason) => {
    try {
      await absencesAPI.reject(absenceId, reason);
      await loadAbsenceRequests();
    } catch (error) {
      console.error('Failed to reject absence request:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors['pending'];
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Ausstehend',
      'approved': 'Genehmigt',
      'rejected': 'Abgelehnt'
    };
    return texts[status] || 'Unbekannt';
  };

  const getAbsenceTypeText = (type) => {
    const texts = {
      'urlaub': 'Urlaub',
      'krankheit': 'Krankheit',
      'freistellung': 'Freistellung'
    };
    return texts[type] || 'Unbekannt';
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Urlaubsdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Urlaubsverwaltung</h1>
          <p className="text-gray-600 mt-2">
            Verwalten Sie Ihre Abwesenheitsanträge und Urlaubskonten
          </p>
        </div>

        {/* Urlaubskonto Info */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Urlaubskonto</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{user?.vacation_days_remaining || 0}</div>
              <div className="text-sm text-gray-600">Verfügbar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {absenceRequests.filter(a => a.absence_type === 'urlaub' && a.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-600">Genommen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {absenceRequests.filter(a => a.absence_type === 'urlaub' && a.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Beantragt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {user?.vacation_days_remaining || 0} - {absenceRequests.filter(a => a.absence_type === 'urlaub' && a.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Verbleibend</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              + Neuer Antrag
            </button>
            
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
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🗓️ Kalender
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {viewMode === 'list' ? (
              <div className="bg-white rounded-lg shadow-lg">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Anträge</h3>
                  
                  {absenceRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Keine Anträge vorhanden</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {absenceRequests.map(request => (
                        <div
                          key={request.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleAbsenceClick(request)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">
                                  {request.absence_type === 'urlaub' ? '🏖️' : 
                                   request.absence_type === 'krankheit' ? '🏥' : '📋'}
                                </span>
                                <h4 className="font-medium text-gray-800">
                                  {getAbsenceTypeText(request.absence_type)}
                                </h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                                  {getStatusText(request.status)}
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600 mb-2">
                                {new Date(request.start_date).toLocaleDateString('de-DE')} - {new Date(request.end_date).toLocaleDateString('de-DE')}
                                <span className="ml-2 text-gray-500">
                                  ({calculateDays(request.start_date, request.end_date)} Tage)
                                </span>
                              </div>
                              
                              {request.reason && (
                                <div className="text-sm text-gray-600">
                                  {request.reason}
                                </div>
                              )}
                            </div>
                            
                            {(isMeister() || isAdmin()) && request.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(request.id);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors"
                                >
                                  Genehmigen
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const reason = prompt('Grund für Ablehnung:');
                                    if (reason) {
                                      handleReject(request.id, reason);
                                    }
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors"
                                >
                                  Ablehnen
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <AbsenceCalendar onAbsenceClick={handleAbsenceClick} />
            )}
          </div>
          
          <div>
            {showForm && (
              <AbsenceRequestForm onSubmit={handleCreateRequest} />
            )}
            
            {selectedAbsence && !showForm && (
              <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {getAbsenceTypeText(selectedAbsence.absence_type)}
                  </h3>
                  <button
                    onClick={() => setSelectedAbsence(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedAbsence.status)}`}>
                      {getStatusText(selectedAbsence.status)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Zeitraum:</span>
                    <div className="ml-2">
                      {new Date(selectedAbsence.start_date).toLocaleDateString('de-DE')} - {new Date(selectedAbsence.end_date).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Tage:</span>
                    <span className="ml-2">{calculateDays(selectedAbsence.start_date, selectedAbsence.end_date)}</span>
                  </div>
                  {selectedAbsence.reason && (
                    <div>
                      <span className="font-medium">Grund:</span>
                      <div className="ml-2">{selectedAbsence.reason}</div>
                    </div>
                  )}
                  {selectedAbsence.rejection_reason && (
                    <div>
                      <span className="font-medium">Ablehnungsgrund:</span>
                      <div className="ml-2 text-red-600">{selectedAbsence.rejection_reason}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrlaubPage; 