import React, { useState } from 'react';
import axios from 'axios';
import StatusBadge from './StatusBadge';
import './ZeiteintraegeTabelle.css';

const ZeiteintraegeTabelle = ({ entries, onEditEntry, onEntryUpdated }) => {
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);

  // Zeit-Optionen für Dropdowns
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  const breakOptions = [
    { value: 0, label: 'Keine Pause' },
    { value: 15, label: '15 Minuten' },
    { value: 30, label: '30 Minuten' },
    { value: 45, label: '45 Minuten' },
    { value: 60, label: '1 Stunde' },
    { value: 90, label: '1,5 Stunden' }
  ];

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5); // Remove seconds
  };

  const formatDuration = (hours) => {
    if (!hours) return '-';
    return `${hours}h`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  const calculateBreakTime = (breakStart, breakEnd) => {
    if (!breakStart || !breakEnd) return '-';
    
    const start = new Date(`2000-01-01T${breakStart}`);
    const end = new Date(`2000-01-01T${breakEnd}`);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    return `${diffMins}min`;
  };

  const getWorkTypeInfo = (workType) => {
    const workTypes = {
      'regular': { label: 'Regulär', icon: '🏢', color: '#0066b3' },
      'overtime': { label: 'Überstunden', icon: '⏰', color: '#f59e0b' },
      'sick': { label: 'Krankheit', icon: '🏥', color: '#ef4444' },
      'vacation': { label: 'Urlaub', icon: '🏖️', color: '#10b981' },
      'training': { label: 'Schulung', icon: '📚', color: '#8b5cf6' },
      'travel': { label: 'Dienstreise', icon: '🚗', color: '#06b6d4' },
      'other': { label: 'Sonstiges', icon: '📝', color: '#6b7280' }
    };
    
    return workTypes[workType] || { label: 'Unbekannt', icon: '❓', color: '#6b7280' };
  };

  const formatWorkType = (workType) => {
    if (!workType) return '-';
    const info = getWorkTypeInfo(workType);
    return (
      <span className="work-type-badge" style={{ backgroundColor: info.color + '20', color: info.color, borderColor: info.color }}>
        <span className="work-type-icon-small">{info.icon}</span>
        {info.label}
      </span>
    );
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      date: entry.date,
      startTime: entry.clock_in || '',
      endTime: entry.clock_out || '',
      breakTime: entry.break_time || 0,
      hours: entry.total_hours || '',
      note: entry.note || '',
      entryType: entry.clock_in ? 'fullDay' : 'hoursOnly'
    });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const entryData = {
        date: editForm.date,
        note: editForm.note,
        entry_type: editForm.entryType
      };

      if (editForm.entryType === 'fullDay') {
        entryData.start_time = editForm.startTime;
        entryData.end_time = editForm.endTime;
        entryData.break_time = editForm.breakTime;
      } else {
        entryData.hours = parseFloat(editForm.hours);
      }

      const response = await axios.put(`http://localhost:8080/api/monteur/time-entries/${editingEntry.id}`, entryData);
      
      if (response.data.success) {
        setEditingEntry(null);
        setEditForm({});
        if (onEntryUpdated) onEntryUpdated();
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`http://localhost:8080/api/monteur/time-entries/${entryId}`);
      
      if (response.data.success) {
        if (onEntryUpdated) onEntryUpdated();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
    setLoading(false);
  };

  const canEdit = (entry) => {
    const today = new Date().toISOString().split('T')[0];
    const isToday = entry.date === today;
    const isEditable = ['open', 'rejected'].includes(entry.status);
    
    return isToday || isEditable;
  };

  const canDelete = (entry) => {
    const today = new Date().toISOString().split('T')[0];
    const isToday = entry.date === today;
    const isDeletable = ['open', 'rejected'].includes(entry.status);
    
    return isToday || isDeletable;
  };

  return (
    <div className="zeiteintraege-tabelle">
      <div className="table-container">
        <table className="entries-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Typ</th>
              <th>Startzeit</th>
              <th>Endzeit</th>
              <th>Pausen</th>
              <th>Arbeitszeit</th>
              <th>Notiz</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-entries">
                  Keine Zeiteinträge gefunden
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  {editingEntry?.id === entry.id ? (
                    // Edit Mode
                    <tr className="edit-row">
                      <td>
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <select
                          value={editForm.startTime}
                          onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                          className="edit-select"
                        >
                          <option value="">-</option>
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={editForm.endTime}
                          onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
                          className="edit-select"
                        >
                          <option value="">-</option>
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={editForm.breakTime}
                          onChange={(e) => setEditForm({...editForm, breakTime: e.target.value})}
                          className="edit-select"
                        >
                          {breakOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {editForm.entryType === 'hoursOnly' ? (
                          <select
                            value={editForm.hours}
                            onChange={(e) => setEditForm({...editForm, hours: e.target.value})}
                            className="edit-select"
                          >
                            <option value="">-</option>
                            {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(hour => (
                              <option key={hour} value={hour}>{hour}h</option>
                            ))}
                          </select>
                        ) : (
                          formatDuration(entry.total_hours)
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.note || ''}
                          onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                          className="edit-input"
                          placeholder="Notiz..."
                        />
                      </td>
                      <td>
                        <StatusBadge status={entry.status} />
                      </td>
                      <td>
                        <div className="edit-actions">
                          <button
                            onClick={handleSaveEdit}
                            disabled={loading}
                            className="save-btn-small"
                            title="Speichern"
                          >
                            {loading ? '...' : '✓'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="cancel-btn-small"
                            title="Abbrechen"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // View Mode
                    <tr className="entry-row">
                      <td>{formatDate(entry.date)}</td>
                      <td>{formatWorkType(entry.work_type)}</td>
                      <td>{formatTime(entry.clock_in)}</td>
                      <td>{formatTime(entry.clock_out)}</td>
                      <td>
                        {entry.break_start && entry.break_end ? (
                          <span title={`${entry.break_start} - ${entry.break_end}`}>
                            {calculateBreakTime(entry.break_start, entry.break_end)}
                          </span>
                        ) : (
                          entry.break_start ? (
                            <span title={`${entry.break_start} - ...`}>
                              {calculateBreakTime(entry.break_start, entry.break_start)}
                            </span>
                          ) : (
                            '-'
                          )
                        )}
                      </td>
                      <td>
                        <div className="hours-display">
                          <span className="total-hours">{formatDuration(entry.total_hours)}</span>
                          {entry.overtime_hours > 0 && (
                            <span className="overtime-badge" title={`${entry.overtime_hours}h Überstunden`}>
                              +{entry.overtime_hours}h
                            </span>
                          )}
                          {entry.regular_hours > 0 && entry.overtime_hours > 0 && (
                            <div className="hours-breakdown">
                              <small className="regular-hours">{entry.regular_hours}h regulär</small>
                              <small className="overtime-hours">+{entry.overtime_hours}h Überstunden</small>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="note-text" title={entry.note}>
                          {entry.note ? (entry.note.length > 30 ? entry.note.substring(0, 30) + '...' : entry.note) : '-'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={entry.status} />
                      </td>
                      <td>
                        <div className="action-buttons">
                          {canEdit(entry) && (
                            <button
                              onClick={() => handleEdit(entry)}
                              className="edit-btn"
                              title="Bearbeiten"
                            >
                              ✏️
                            </button>
                          )}
                          {canDelete(entry) && (
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="delete-btn"
                              title="Löschen"
                            >
                              🗑️
                            </button>
                          )}
                          {!canEdit(entry) && !canDelete(entry) && (
                            <span className="no-edit">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ZeiteintraegeTabelle; 