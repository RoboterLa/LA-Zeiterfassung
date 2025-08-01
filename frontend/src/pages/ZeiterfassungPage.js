import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ArbeitszeitTimer from '../components/ArbeitszeitTimer';

const ZeiterfassungPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('timer');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    elevator_id: '',
    location: '',
    entry_date: new Date().toISOString().split('T')[0],
    activity_type: 'maintenance',
    other_activity: '',
    start_time: '',
    end_time: '17:00',
    emergency_week: 'no',
    notes: ''
  });

  const activityOptions = [
    { value: 'maintenance', label: 'Wartung', icon: '⚙️' },
    { value: 'repairs', label: 'Reparatur', icon: '🔧' },
    { value: 'fixedprice', label: 'Festpreis', icon: '💼' },
    { value: 'emergency', label: 'Notdienst', icon: '🚨' },
    { value: 'office', label: 'Büro', icon: '🏢' },
    { value: 'sick', label: 'Krank', icon: '🏥' },
    { value: 'vacation', label: 'Urlaub', icon: '🏖️' },
    { value: 'holiday', label: 'Feiertag', icon: '🎉' },
    { value: 'overtime', label: 'Überstunden', icon: '⏰' },
    { value: 'other', label: 'Sonstige', icon: '📋' }
  ];

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Zeiteintrag gespeichert:', formData);
    // Reset form
    setFormData({
      elevator_id: '',
      location: '',
      entry_date: new Date().toISOString().split('T')[0],
      activity_type: 'maintenance',
      other_activity: '',
      start_time: '',
      end_time: '17:00',
      emergency_week: 'no',
      notes: ''
    });
  };

  const resetForm = () => {
    const now = new Date();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = Math.round(now.getMinutes() / 30) * 30;
    if (minutes === 60) {
      minutes = 0;
      hours = ((parseInt(hours) + 1) % 24).toString().padStart(2, '0');
    }
    const currentTime = `${hours}:${minutes.toString().padStart(2, '0')}`;

    setFormData({
      elevator_id: '',
      location: '',
      entry_date: new Date().toISOString().split('T')[0],
      activity_type: 'maintenance',
      other_activity: '',
      start_time: currentTime,
      end_time: '17:00',
      emergency_week: 'no',
      notes: ''
    });
  };

  const calculateDuration = (start, end) => {
    const startTime = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}:${diffMinutes.toString().padStart(2, '0')}`;
  };

  const getActivityLabel = (activity) => {
    const option = activityOptions.find(opt => opt.value === activity);
    return option ? option.label : activity;
  };

  useEffect(() => {
    const now = new Date();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = Math.round(now.getMinutes() / 30) * 30;
    if (minutes === 60) {
      minutes = 0;
      hours = ((parseInt(hours) + 1) % 24).toString().padStart(2, '0');
    }
    const currentTime = `${hours}:${minutes.toString().padStart(2, '0')}`;

    setFormData(prev => ({
      ...prev,
      start_time: currentTime
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        user={user} 
        pendingCount={0}
        overtimeWarnings={[]}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Zeiterfassung</h1>
          <p className="text-gray-600">Erfassen Sie Ihre Arbeitszeiten und Tätigkeiten</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('timer')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'timer'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Arbeitszeit Timer
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manueller Eintrag
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Zeitprotokoll
              </button>
            </nav>
          </div>
        </div>

        {/* Timer Tab */}
        {activeTab === 'timer' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Arbeitszeit Timer</h2>
            <ArbeitszeitTimer />
          </div>
        )}

        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manueller Zeiteintrag</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aufzug-ID*
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.elevator_id}
                    onChange={(e) => setFormData({...formData, elevator_id: e.target.value})}
                    placeholder="Aufzug-ID eingeben"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Standort*
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Standort eingeben"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datum*
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.entry_date}
                    onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Activity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tätigkeitsart*
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {activityOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`border rounded-md p-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                        formData.activity_type === option.value 
                          ? 'border-blue-500 bg-blue-100' 
                          : 'border-gray-300'
                      }`}
                      onClick={() => setFormData({...formData, activity_type: option.value})}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{option.icon}</span>
                        <span className="text-sm font-medium">{option.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.activity_type === 'other' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={formData.other_activity}
                      onChange={(e) => setFormData({...formData, other_activity: e.target.value})}
                      placeholder="Sonstige Tätigkeit beschreiben"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startzeit*
                  </label>
                  <select
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endzeit*
                  </label>
                  <select
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emergency Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notdienstwoche*
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="emergency-week"
                      value="yes"
                      required
                      checked={formData.emergency_week === 'yes'}
                      onChange={(e) => setFormData({...formData, emergency_week: e.target.value})}
                      className="mr-2"
                    />
                    Ja
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="emergency-week"
                      value="no"
                      checked={formData.emergency_week === 'no'}
                      onChange={(e) => setFormData({...formData, emergency_week: e.target.value})}
                      className="mr-2"
                    />
                    Nein
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Details zur durchgeführten Arbeit..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Zurücksetzen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Eintrag speichern
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Zeitprotokoll</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                CSV Export
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aufzug-ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tätigkeit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zeitraum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dauer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notdienst</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Keine Zeiteinträge gefunden.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.elevator_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getActivityLabel(entry.activity_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.start_time} - {entry.end_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {calculateDuration(entry.start_time, entry.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.emergency_week === 'yes' ? 'Ja' : 'Nein'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Genehmigt
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            Bearbeiten
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Löschen
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ZeiterfassungPage; 