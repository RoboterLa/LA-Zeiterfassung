'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { zeiterfassungApi } from '@/services/api';
import { TimeEntry } from '@/types';

interface ActivityOption {
  value: string;
  label: string;
  icon: string;
  color: string;
}

const activityOptions: ActivityOption[] = [
  { value: 'maintenance', label: 'Wartung', icon: '⚙️', color: 'text-black' },
  { value: 'repairs', label: 'Reparatur', icon: '🔧', color: 'text-black' },
  { value: 'fixedprice', label: 'Festpreis', icon: '💼', color: 'text-black' },
  { value: 'emergency', label: 'Notdienst', icon: '🚨', color: 'text-black' },
  { value: 'office', label: 'Büro', icon: '🏢', color: 'text-black' },
  { value: 'sick', label: 'Krank', icon: '🏥', color: 'text-black' },
  { value: 'vacation', label: 'Urlaub', icon: '🏖️', color: 'text-black' },
  { value: 'holiday', label: 'Feiertag', icon: '🎉', color: 'text-black' },
  { value: 'overtime', label: 'Überstunden', icon: '⏰', color: 'text-black' },
  { value: 'other', label: 'Sonstige', icon: '📋', color: 'text-black' },
];

export default function ZeiterfassungPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    elevator_id: string;
    location: string;
    entry_date: string;
    activity_type: string;
    other_activity: string;
    start_time: string;
    end_time: string;
    emergency_week: string;
    notes: string;
  }>({
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

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    text: '',
    activity: '',
    elevator: '',
    date_type: 'all',
    date_start: '',
    date_end: ''
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  // Load entries
  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await zeiterfassungApi.getEntries();
      setEntries(data);
    } catch (err) {
      setError('Fehler beim Laden der Einträge');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.start_time >= formData.end_time) {
      showNotification('Die Endzeit muss nach der Startzeit liegen.', 'error');
      return;
    }

    try {
      const response = await zeiterfassungApi.addEntry({
        elevator_id: formData.elevator_id,
        location: formData.location,
        entry_date: formData.entry_date,
        activity_type: formData.activity_type,
        other_activity: formData.activity_type === 'other' ? formData.other_activity : '',
        start_time: formData.start_time,
        end_time: formData.end_time,
        emergency_week: formData.emergency_week,
        notes: formData.notes
      });

      if (response.status === 'success') {
        showNotification(response.message || 'Eintrag erfolgreich gespeichert.', 'success');
        resetForm();
        loadEntries();
      } else {
        showNotification(response.message || 'Fehler beim Speichern.', 'error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification('Fehler beim Speichern des Eintrags.', 'error');
    }
  };

  // Handle edit submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEntry) return;

    if (formData.start_time >= formData.end_time) {
      showNotification('Die Endzeit muss nach der Startzeit liegen.', 'error');
      return;
    }

    try {
      const response = await zeiterfassungApi.editEntry(editingEntry.id, {
        elevator_id: formData.elevator_id || '',
        location: formData.location || '',
        entry_date: formData.entry_date || '',
        activity_type: formData.activity_type || '',
        other_activity: formData.activity_type === 'other' ? formData.other_activity || '' : '',
        start_time: formData.start_time || '',
        end_time: formData.end_time || '',
        emergency_week: formData.emergency_week || '',
        notes: formData.notes || ''
      });

      if (response.status === 'success') {
        showNotification(response.message || 'Eintrag erfolgreich aktualisiert.', 'success');
        setShowEditModal(false);
        setEditingEntry(null);
        loadEntries();
      } else {
        showNotification(response.message || 'Fehler beim Aktualisieren.', 'error');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      showNotification('Fehler beim Aktualisieren des Eintrags.', 'error');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?')) return;

    try {
      const response = await zeiterfassungApi.deleteEntry(id);
      if (response.status === 'success') {
        showNotification(response.message || 'Eintrag erfolgreich gelöscht.', 'success');
        loadEntries();
      } else {
        showNotification(response.message || 'Fehler beim Löschen.', 'error');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      showNotification('Fehler beim Löschen des Eintrags.', 'error');
    }
  };

  // Handle edit
  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      elevator_id: entry.elevator_id,
      location: entry.location,
      entry_date: entry.date,
      activity_type: entry.activity_type,
      other_activity: entry.other_activity || '',
      start_time: entry.start_time,
      end_time: entry.end_time,
      emergency_week: entry.emergency_week,
      notes: entry.notes || ''
    });
    setShowEditModal(true);
  };

  // Reset form
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

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Calculate duration
  const calculateDuration = (start: string, end: string): string => {
    const startTime = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}:${diffMinutes.toString().padStart(2, '0')}`;
  };

  // Get activity label
  const getActivityLabel = (activity: string): string => {
    const option = activityOptions.find(opt => opt.value === activity);
    return option ? option.label : activity;
  };

  // Generate time options
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

  // Initialize form with current time
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

    loadEntries();
  }, []);

  // Pre-fill from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auftrag = params.get('auftrag');
    if (auftrag) {
      const artMap: { [key: string]: string } = {
        'Reparatur': 'repairs',
        'Wartung': 'maintenance',
        'Modernisierung': 'fixedprice',
        'Notdienst': 'emergency',
        'Büro': 'office',
        'Krank': 'sick',
        'Urlaub': 'vacation',
        'Feiertag': 'holiday',
        'Überstunden': 'overtime',
        'Sonstige': 'other',
        'Festpreis': 'fixedprice'
      };

      let art = '', standort = '';
      let parts = auftrag.split(':');
      if (parts.length === 2) {
        art = parts[0].trim();
        standort = parts[1].trim();
      } else {
        parts = auftrag.trim().split(' ');
        art = parts[0];
        standort = parts.slice(1).join(' ');
      }

      const mapped = artMap[art] || 'other';
      setFormData(prev => ({
        ...prev,
        location: standort,
        activity_type: mapped
      }));
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={{ id: '1', name: 'Dev User', email: 'dev@example.com', is_admin: true, can_approve: true }} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Lade Einträge...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={{ id: '1', name: 'Dev User', email: 'dev@example.com', is_admin: true, can_approve: true }} />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Monteur Zeiterfassungssystem</h1>

        {/* Time Entry Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Zeiteintrag</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="elevator-id" className="block text-sm font-semibold text-gray-900 mb-1">
                  Aufzug-ID*
                </label>
                <input
                  type="text"
                  id="elevator-id"
                  required
                  value={formData.elevator_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, elevator_id: e.target.value }))}
                  placeholder="Aufzug-ID eingeben"
                  className="form-input w-full px-3 py-2 border border-gray-500 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-1">
                  Standort*
                </label>
                <input
                  type="text"
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Standort eingeben (z. B. Berlin Hauptbahnhof)"
                  className="form-input w-full px-3 py-2 border border-gray-500 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="entry-date" className="block text-sm font-semibold text-gray-900 mb-1">
                  Datum*
                </label>
                <input
                  type="date"
                  id="entry-date"
                  required
                  value={formData.entry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
                  className="form-input w-full px-3 py-2 border border-gray-500 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Activity Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Tätigkeitsart*</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {activityOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`activity-quick-select border rounded-md p-2 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                      formData.activity_type === option.value ? 'border-blue-600 bg-blue-100' : 'border-gray-400'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, activity_type: option.value }))}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{option.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{option.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <input type="hidden" value={formData.activity_type} />
              {formData.activity_type === 'other' && (
                <div className="mt-2">
                  <label htmlFor="other-activity" className="block text-sm font-semibold text-gray-900 mb-1">
                    Sonstige Tätigkeit
                  </label>
                  <input
                    type="text"
                    id="other-activity"
                    value={formData.other_activity}
                    onChange={(e) => setFormData(prev => ({ ...prev, other_activity: e.target.value }))}
                    placeholder="Andere Tätigkeitsart angeben"
                    className="form-input w-full px-3 py-2 border border-gray-500 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-time" className="block text-sm font-semibold text-gray-900 mb-1">
                  Startzeit*
                </label>
                <select
                  id="start-time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="form-input w-full px-3 py-2 border border-gray-500 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white text-sm"
                >
                  {generateTimeOptions().map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="end-time" className="block text-sm font-semibold text-gray-900 mb-1">
                  Endzeit*
                </label>
                <select
                  id="end-time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="form-input w-full px-3 py-2 border border-gray-500 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white text-sm"
                >
                  {generateTimeOptions().map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Emergency Week */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Notdienstwoche*</label>
              <div className="flex space-x-4">
                <label className="flex items-center text-gray-900 font-medium">
                  <input
                    type="radio"
                    name="emergency-week"
                    value="yes"
                    required
                    checked={formData.emergency_week === 'yes'}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_week: e.target.value }))}
                    className="mr-2"
                  />
                  Ja
                </label>
                <label className="flex items-center text-gray-900 font-medium">
                  <input
                    type="radio"
                    name="emergency-week"
                    value="no"
                    checked={formData.emergency_week === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_week: e.target.value }))}
                    className="mr-2"
                  />
                  Nein
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-1">
                Notizen
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Details zur durchgeführten Arbeit..."
                className="form-input w-full px-3 py-2 border border-gray-500 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
              />
            </div>

            {/* Form Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 border border-gray-400 font-medium"
              >
                Zurücksetzen
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              >
                Eintrag speichern
              </button>
            </div>
          </form>
        </div>

        {/* Time Log */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-3 md:space-y-0">
            <h2 className="text-xl font-bold text-gray-900">Zeitprotokoll</h2>
            <div className="flex space-x-2">
                              <a
                  href="/export"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 flex items-center font-medium"
                >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV exportieren
              </a>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Filter</h3>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none font-medium"
              >
                <span>{showAdvancedFilters ? 'Erweitert ausblenden' : 'Erweitert anzeigen'}</span>
                <svg className="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="filter-text" className="block text-xs font-semibold text-gray-900 mb-1">Suche</label>
                <input
                  type="text"
                  id="filter-text"
                  placeholder="Suchen..."
                  value={filters.text}
                  onChange={(e) => setFilters(prev => ({ ...prev, text: e.target.value }))}
                  className="form-input w-full px-3 py-1.5 text-sm border border-gray-500 rounded-md text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="filter-activity" className="block text-xs font-semibold text-gray-900 mb-1">Tätigkeit</label>
                <select
                  id="filter-activity"
                  value={filters.activity}
                  onChange={(e) => setFilters(prev => ({ ...prev, activity: e.target.value }))}
                  className="form-input w-full px-3 py-1.5 text-sm border border-gray-500 rounded-md text-gray-900 bg-white"
                >
                  <option value="">Alle Tätigkeiten</option>
                  {activityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-elevator" className="block text-xs font-semibold text-gray-900 mb-1">Aufzug-ID</label>
                <select
                  id="filter-elevator"
                  value={filters.elevator}
                  onChange={(e) => setFilters(prev => ({ ...prev, elevator: e.target.value }))}
                  className="form-input w-full px-3 py-1.5 text-sm border border-gray-500 rounded-md text-gray-900 bg-white"
                >
                  <option value="">Alle Aufzüge</option>
                  {Array.from(new Set(entries.map(e => e.elevator_id))).map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="filter-date-type" className="block text-xs font-medium text-gray-500 mb-1">Datumsfilter</label>
                    <select
                      id="filter-date-type"
                      value={filters.date_type}
                      onChange={(e) => setFilters(prev => ({ ...prev, date_type: e.target.value }))}
                      className="form-input w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="all">Alle Daten</option>
                      <option value="today">Heute</option>
                      <option value="yesterday">Gestern</option>
                      <option value="custom">Benutzerdefinierter Zeitraum</option>
                    </select>
                  </div>
                  {filters.date_type === 'custom' && (
                    <>
                      <div>
                        <label htmlFor="filter-date-start" className="block text-xs font-medium text-gray-500 mb-1">Startdatum</label>
                        <input
                          type="date"
                          id="filter-date-start"
                          value={filters.date_start}
                          onChange={(e) => setFilters(prev => ({ ...prev, date_start: e.target.value }))}
                          className="form-input w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label htmlFor="filter-date-end" className="block text-xs font-medium text-gray-500 mb-1">Enddatum</label>
                        <input
                          type="date"
                          id="filter-date-end"
                          value={filters.date_end}
                          onChange={(e) => setFilters(prev => ({ ...prev, date_end: e.target.value }))}
                          className="form-input w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => setFilters({
                      text: '', activity: '', elevator: '', date_type: 'all', date_start: '', date_end: ''
                    })}
                    className="text-sm text-gray-600 hover:text-gray-800 mr-3"
                  >
                    Filter zurücksetzen
                  </button>
                  <button
                    onClick={loadEntries}
                    className="text-sm bg-[#0066b3]/20 text-[#0066b3] px-3 py-1 rounded hover:bg-[#0066b3]/30"
                  >
                    Filter anwenden
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Entries Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aufzug-ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tätigkeit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeitraum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dauer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notdienstwoche</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notizen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      Keine Zeiteinträge gefunden.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.elevator_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getActivityLabel(entry.activity_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.start_time} - {entry.end_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {calculateDuration(entry.start_time, entry.end_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.emergency_week === 'yes' ? 'Ja' : 'Nein'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entry.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.status === 'pending' ? 'Ausstehend' : 
                         entry.status === 'approved' ? 'Genehmigt' : 'Abgelehnt'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-800"
                        >
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
      </main>

      {/* Edit Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg min-w-80 max-w-2xl max-h-80vh overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#0066b3]">Zeiteintrag bearbeiten</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Edit form fields - same as main form but with edit- prefix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="edit-elevator-id" className="block text-sm font-medium text-gray-700 mb-1">
                    Aufzug-ID*
                  </label>
                  <input
                    type="text"
                    id="edit-elevator-id"
                    required
                    value={formData.elevator_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, elevator_id: e.target.value }))}
                    placeholder="Aufzug-ID eingeben"
                    className="form-input w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                  />
                </div>
                <div>
                  <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1">
                    Standort*
                  </label>
                  <input
                    type="text"
                    id="edit-location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Standort eingeben"
                    className="form-input w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                  />
                </div>
                <div>
                  <label htmlFor="edit-entry-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Datum*
                  </label>
                  <input
                    type="date"
                    id="edit-entry-date"
                    required
                    value={formData.entry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
                    className="form-input w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                  />
                </div>
              </div>

              {/* Activity Selection for Edit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tätigkeitsart*</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {activityOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`activity-quick-select border rounded-md p-3 cursor-pointer transition-all duration-200 hover:transform hover:-translate-y-1 ${
                        formData.activity_type === option.value ? 'border-[#0066b3] bg-[#0066b3]/10' : 'border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, activity_type: option.value }))}
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{option.icon}</span>
                        <span className="text-sm">{option.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.activity_type === 'other' && (
                  <div className="mt-2">
                    <label htmlFor="edit-other-activity" className="block text-sm font-medium text-gray-700 mb-1">
                      Sonstige Tätigkeit
                    </label>
                    <input
                      type="text"
                      id="edit-other-activity"
                      value={formData.other_activity}
                      onChange={(e) => setFormData(prev => ({ ...prev, other_activity: e.target.value }))}
                      placeholder="Andere Tätigkeitsart angeben"
                      className="form-input w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                    />
                  </div>
                )}
              </div>

              {/* Time Selection for Edit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-start-time" className="block text-sm font-medium text-gray-700 mb-1">
                    Startzeit*
                  </label>
                  <select
                    id="edit-start-time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="form-input w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                  >
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-end-time" className="block text-sm font-medium text-gray-700 mb-1">
                    Endzeit*
                  </label>
                  <select
                    id="edit-end-time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="form-input w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                  >
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emergency Week for Edit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notdienstwoche*</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="edit-emergency-week"
                      value="yes"
                      required
                      checked={formData.emergency_week === 'yes'}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_week: e.target.value }))}
                      className="mr-2"
                    />
                    Ja
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="edit-emergency-week"
                      value="no"
                      checked={formData.emergency_week === 'no'}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_week: e.target.value }))}
                      className="mr-2"
                    />
                    Nein
                  </label>
                </div>
              </div>

              {/* Notes for Edit */}
              <div>
                <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  id="edit-notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Details zur durchgeführten Arbeit..."
                  className="form-input w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3]"
                />
              </div>

              {/* Edit Form Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="bg-[#0066b3] hover:bg-[#005a9e] text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0066b3]"
                >
                  Änderungen speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
} 