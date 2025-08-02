import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, sitesAPI } from '../services/api';

const WorkReportForm = ({ onSubmit, initialData = null }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState([]);
  const [formData, setFormData] = useState({
    job_site_id: '',
    date: new Date().toISOString().split('T')[0],
    units: '',
    factor: 1.0,
    task_type: 'wartung',
    emergency_service: false,
    emergency_start: '',
    emergency_end: '',
    note: ''
  });

  // Lade Job-Sites beim Start
  useEffect(() => {
    loadSites();
  }, []);

  // Setze initiale Daten falls vorhanden
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const loadSites = async () => {
    try {
      const response = await sitesAPI.getAll();
      setSites(response.data.sites || []);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await reportsAPI.create(formData);
      
      if (response.data.success) {
        onSubmit?.(response.data.work_report);
        // Reset form
        setFormData({
          job_site_id: '',
          date: new Date().toISOString().split('T')[0],
          units: '',
          factor: 1.0,
          task_type: 'wartung',
          emergency_service: false,
          emergency_start: '',
          emergency_end: '',
          note: ''
        });
      }
    } catch (error) {
      console.error('Failed to create work report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeFactor = (taskType) => {
    const factors = {
      'wartung': 1.25,
      'reparatur': 1.5,
      'montage': 1.0,
      'wartung_komplex': 1.75,
      'notdienst': 2.0
    };
    return factors[taskType] || 1.0;
  };

  const handleTaskTypeChange = (e) => {
    const taskType = e.target.value;
    const factor = getTaskTypeFactor(taskType);
    
    setFormData(prev => ({
      ...prev,
      task_type: taskType,
      factor: factor
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tagesbericht erstellen</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Site */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Standort/Auftrag *
          </label>
          <select
            name="job_site_id"
            value={formData.job_site_id}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Standort auswählen...</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name} - {site.address}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Datum *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Task Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aufgabentyp *
          </label>
          <select
            name="task_type"
            value={formData.task_type}
            onChange={handleTaskTypeChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="wartung">Wartung (Faktor 1,25)</option>
            <option value="reparatur">Reparatur (Faktor 1,5)</option>
            <option value="montage">Montage (Faktor 1,0)</option>
            <option value="wartung_komplex">Komplexe Wartung (Faktor 1,75)</option>
            <option value="notdienst">Notdienst (Faktor 2,0)</option>
          </select>
        </div>

        {/* Units */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Einheiten *
          </label>
          <input
            type="number"
            name="units"
            value={formData.units}
            onChange={handleInputChange}
            required
            min="0"
            step="0.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="z.B. 8.0"
          />
        </div>

        {/* Factor Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Aktueller Faktor:</span>
            <span className="text-lg font-bold text-blue-600">{formData.factor}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Berechnete Einheiten: {(formData.units * formData.factor).toFixed(2)}
          </div>
        </div>

        {/* Emergency Service */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="emergency_service"
            checked={formData.emergency_service}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-700">
            Notdienst
          </label>
        </div>

        {/* Emergency Service Times */}
        {formData.emergency_service && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notdienst Start
              </label>
              <input
                type="datetime-local"
                name="emergency_start"
                value={formData.emergency_start}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notdienst Ende
              </label>
              <input
                type="datetime-local"
                name="emergency_end"
                value={formData.emergency_end}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notiz
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Zusätzliche Informationen..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Speichere...' : 'Tagesbericht speichern'}
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

export default WorkReportForm; 