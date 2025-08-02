import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { absencesAPI } from '../services/api';

const AbsenceRequestForm = ({ onSubmit, initialData = null }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    absence_type: 'urlaub',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await absencesAPI.create(formData);
      
      if (response.data.success) {
        onSubmit?.(response.data.absence_request);
        // Reset form
        setFormData({
          absence_type: 'urlaub',
          start_date: '',
          end_date: '',
          reason: ''
        });
      }
    } catch (error) {
      console.error('Failed to create absence request:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  };

  const getAbsenceTypeInfo = (type) => {
    const types = {
      'urlaub': {
        label: 'Urlaub',
        color: 'text-blue-600',
        icon: '🏖️',
        description: 'Jahresurlaub oder Sonderurlaub'
      },
      'krankheit': {
        label: 'Krankheit',
        color: 'text-red-600',
        icon: '🏥',
        description: 'Krankheitsbedingte Abwesenheit'
      },
      'freistellung': {
        label: 'Freistellung',
        color: 'text-purple-600',
        icon: '📋',
        description: 'Sonderfreistellung oder unbezahlter Urlaub'
      }
    };
    return types[type] || types['urlaub'];
  };

  const absenceTypeInfo = getAbsenceTypeInfo(formData.absence_type);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Abwesenheitsantrag</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Abwesenheitstyp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Abwesenheitstyp *
          </label>
          <select
            name="absence_type"
            value={formData.absence_type}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="urlaub">🏖️ Urlaub</option>
            <option value="krankheit">🏥 Krankheit</option>
            <option value="freistellung">📋 Freistellung</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {absenceTypeInfo.description}
          </p>
        </div>

        {/* Datum */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startdatum *
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enddatum *
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              required
              min={formData.start_date || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tage-Anzeige */}
        {formData.start_date && formData.end_date && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Anzahl Tage:</span>
              <span className="text-lg font-bold text-blue-600">{calculateDays()} Tage</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formData.start_date} bis {formData.end_date}
            </div>
          </div>
        )}

        {/* Grund */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grund (optional)
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Zusätzliche Informationen zum Antrag..."
          />
        </div>

        {/* Urlaubskonto Info */}
        {formData.absence_type === 'urlaub' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Urlaubskonto</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Verfügbar:</span>
                <span className="font-semibold">{user?.vacation_days_remaining || 0} Tage</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Beantragt:</span>
                <span className="font-semibold">{calculateDays()} Tage</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Verbleibend:</span>
                <span className={`font-semibold ${(user?.vacation_days_remaining || 0) - calculateDays() < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {(user?.vacation_days_remaining || 0) - calculateDays()} Tage
                </span>
              </div>
            </div>
            {(user?.vacation_days_remaining || 0) - calculateDays() < 0 && (
              <div className="mt-2 text-sm text-red-600">
                ⚠️ Nicht genügend Urlaubstage verfügbar
              </div>
            )}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || (formData.absence_type === 'urlaub' && (user?.vacation_days_remaining || 0) - calculateDays() < 0)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Speichere...' : 'Antrag einreichen'}
          </button>
          
          <button
            type="button"
            onClick={() => onSubmit?.()}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default AbsenceRequestForm; 