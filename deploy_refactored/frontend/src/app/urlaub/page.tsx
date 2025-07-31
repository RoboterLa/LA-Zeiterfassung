'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { urlaubApi } from '@/services/api';
import { Urlaub, UrlaubForm } from '@/types';

interface UrlaubStats {
  tageVerbraucht: number;
  tageVerplant: number;
  tageUebrig: number;
}

interface CalendarDay {
  day: number;
  in_month: boolean;
  is_weekend: boolean;
  is_holiday: boolean;
  is_feiertag: boolean;
}

interface CalendarMonth {
  name: string;
  weeks: CalendarDay[][];
}

interface LegendItem {
  farbe: string;
  text: string;
}

export default function UrlaubPage() {
  const [urlaube, setUrlaube] = useState<Urlaub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UrlaubStats>({
    tageVerbraucht: 0,
    tageVerplant: 0,
    tageUebrig: 30
  });

  // Form state
  const [formData, setFormData] = useState<UrlaubForm>({
    start: '',
    end: '',
    comment: ''
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<UrlaubForm>({
    start: '',
    end: '',
    comment: ''
  });

  // Calendar data
  const [yearCalendar, setYearCalendar] = useState<CalendarMonth[]>([]);
  const [legend, setLegend] = useState<LegendItem[]>([]);

  const loadUrlaube = async () => {
    try {
      setLoading(true);
      const data = await urlaubApi.getUrlaube();
      setUrlaube(data);
      calculateStats(data);
    } catch (err) {
      setError('Fehler beim Laden der Urlaubsdaten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUrlaube();
    generateCalendar();
    generateLegend();
  }, []);

  const calculateStats = (data: Urlaub[]) => {
    const today = new Date();
    let verbraucht = 0;
    let verplant = 0;

    data.forEach(urlaub => {
      const start = new Date(urlaub.start);
      const end = new Date(urlaub.end);
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (end < today) {
        verbraucht += days;
      } else if (start > today) {
        verplant += days;
      } else {
        // Überlappt mit heute
        const pastDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        verbraucht += Math.max(0, pastDays);
        verplant += Math.max(0, days - pastDays);
      }
    });

    setStats({
      tageVerbraucht: verbraucht,
      tageVerplant: verplant,
      tageUebrig: 30 - verbraucht - verplant
    });
  };

  const generateCalendar = () => {
    const months: CalendarMonth[] = [];
    const currentYear = new Date().getFullYear();

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(currentYear, month, 1);
      const lastDay = new Date(currentYear, month + 1, 0);
      const monthName = firstDay.toLocaleDateString('de-DE', { month: 'long' });
      
      const weeks: CalendarDay[][] = [];
      let currentWeek: CalendarDay[] = [];
      
      // Fill in days from previous month
      const firstDayOfWeek = firstDay.getDay() || 7; // Monday = 1, Sunday = 7
      for (let i = 1; i < firstDayOfWeek; i++) {
        const prevMonthLastDay = new Date(currentYear, month, 0);
        const day = prevMonthLastDay.getDate() - (firstDayOfWeek - i - 1);
        currentWeek.push({
          day,
          in_month: false,
          is_weekend: false,
          is_holiday: false,
          is_feiertag: false
        });
      }

      // Fill in current month days
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentYear, month, day);
        const dayOfWeek = date.getDay() || 7;
        
        currentWeek.push({
          day,
          in_month: true,
          is_weekend: dayOfWeek === 6 || dayOfWeek === 7,
          is_holiday: false, // Would need holiday data
          is_feiertag: false // Would need holiday data
        });

        if (dayOfWeek === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // Fill in days from next month
      while (currentWeek.length < 7) {
        currentWeek.push({
          day: currentWeek.length + 1,
          in_month: false,
          is_weekend: false,
          is_holiday: false,
          is_feiertag: false
        });
      }
      weeks.push(currentWeek);

      months.push({ name: monthName, weeks });
    }

    setYearCalendar(months);
  };

  const generateLegend = () => {
    setLegend([
      { farbe: 'bg-green-200', text: 'Urlaub' },
      { farbe: 'bg-yellow-200', text: 'Feiertag' },
      { farbe: 'bg-green-200 border-2 border-yellow-300', text: 'Urlaub + Feiertag' }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate urlaub days
    if (formData.start && formData.end) {
      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);
      const diff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (diff > stats.tageUebrig) {
        alert('Du kannst nicht mehr Urlaub eintragen als du übrig hast!');
        return;
      }
    }

    try {
      const response = await urlaubApi.addUrlaub(formData);
      if (response.status === 'success') {
        alert('Urlaub erfolgreich hinzugefügt!');
        setFormData({ start: '', end: '', comment: '' });
        loadUrlaube();
      } else {
        alert('Fehler: ' + response.message);
      }
    } catch (err) {
      alert('Fehler beim Hinzufügen des Urlaubs');
    }
  };

  const handleEdit = (urlaub: Urlaub) => {
    setEditingId(urlaub.id);
    setEditData({
      start: urlaub.start,
      end: urlaub.end,
      comment: urlaub.comment || ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const response = await urlaubApi.updateUrlaub(editingId, editData);
      if (response.status === 'success') {
        alert('Urlaub erfolgreich bearbeitet!');
        setEditingId(null);
        loadUrlaube();
      } else {
        alert('Fehler: ' + response.message);
      }
    } catch (err) {
      alert('Fehler beim Bearbeiten des Urlaubs');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Urlaub wirklich löschen?')) {
      try {
        const response = await urlaubApi.deleteUrlaub(id);
        if (response.status === 'success') {
          alert('Urlaub erfolgreich gelöscht!');
          loadUrlaube();
        } else {
          alert('Fehler: ' + response.message);
        }
      } catch (err) {
        alert('Fehler beim Löschen des Urlaubs');
      }
    }
  };

  const isPastUrlaub = (urlaub: Urlaub) => {
    const today = new Date();
    const endDate = new Date(urlaub.end);
    return endDate < today;
  };

  const isCurrentUrlaub = (urlaub: Urlaub) => {
    const today = new Date();
    const startDate = new Date(urlaub.start);
    const endDate = new Date(urlaub.end);
    return startDate <= today && endDate >= today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={{ id: '1', name: 'Dev User', email: 'dev@example.com', is_admin: true, can_approve: true }} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Lade Urlaubsdaten...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={{ id: '1', name: 'Dev User', email: 'dev@example.com', is_admin: true, can_approve: true }} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={{ id: '1', name: 'Dev User', email: 'dev@example.com', is_admin: true, can_approve: true }} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Neuer Urlaub */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-[#0066b3] mb-4">Neuen Urlaub eintragen</h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
              <input 
                type="date" 
                value={formData.start}
                onChange={(e) => setFormData({...formData, start: e.target.value})}
                required 
                className="form-input px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum</label>
              <input 
                type="date" 
                value={formData.end}
                onChange={(e) => setFormData({...formData, end: e.target.value})}
                required 
                className="form-input px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kommentar</label>
              <input 
                type="text" 
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                className="form-input px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button 
              type="submit" 
              className="bg-[#0066b3] hover:bg-[#005a9e] text-white font-semibold px-6 py-2 rounded ml-4"
            >
              Eintragen
            </button>
          </form>
          <div className="mt-2 text-sm text-gray-600">
            <span>
              Verbraucht: <b>{stats.tageVerbraucht}</b> Tage, 
              Verplant: <b>{stats.tageVerplant}</b> Tage, 
              Übrig: <b>{stats.tageUebrig}</b> Tage
            </span>
          </div>
        </div>

        {/* Urlaubsübersicht */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="font-semibold mb-2">Meine Urlaube:</h3>
          <div className="mb-4 text-sm text-yellow-700 bg-yellow-100 border-l-4 border-yellow-400 p-3 rounded">
            Bereits begonnene oder vergangene Urlaubstage können nicht mehr geändert werden. Wende dich an deinen Vorgesetzten, falls eine Korrektur nötig ist.
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-2 text-left">Start</th>
                <th className="px-2 py-2 text-left">Ende</th>
                <th className="px-2 py-2 text-left">Kommentar</th>
                <th className="px-2 py-2 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {urlaube.map((urlaub) => (
                <tr key={urlaub.id} className="border-b align-top">
                  {editingId === urlaub.id ? (
                    <form onSubmit={handleEditSubmit} className="contents">
                      <td>
                        <input 
                          type="date" 
                          value={editData.start}
                          onChange={(e) => setEditData({...editData, start: e.target.value})}
                          required 
                          className="form-input px-2 py-1 border border-gray-300 rounded-md"
                        />
                      </td>
                      <td>
                        <input 
                          type="date" 
                          value={editData.end}
                          onChange={(e) => setEditData({...editData, end: e.target.value})}
                          required 
                          className="form-input px-2 py-1 border border-gray-300 rounded-md"
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          value={editData.comment}
                          onChange={(e) => setEditData({...editData, comment: e.target.value})}
                          className="form-input px-2 py-1 border border-gray-300 rounded-md"
                        />
                      </td>
                      <td>
                        <button 
                          type="submit" 
                          className="bg-[#0066b3] hover:bg-[#005a9e] text-white font-semibold px-4 py-1 rounded"
                        >
                          Speichern
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="ml-2 text-gray-500 hover:underline"
                        >
                          Abbrechen
                        </button>
                        {isCurrentUrlaub(urlaub) && (
                          <div className="text-xs text-gray-500 mt-1">
                            Nur zukünftige Tage können noch geändert werden.
                          </div>
                        )}
                      </td>
                    </form>
                  ) : (
                    <>
                      <td>{new Date(urlaub.start).toLocaleDateString('de-DE')}</td>
                      <td>{new Date(urlaub.end).toLocaleDateString('de-DE')}</td>
                      <td>{urlaub.comment}</td>
                      <td>
                        {isPastUrlaub(urlaub) ? (
                          <>
                            <span className="text-gray-500">Genommen</span>
                            <a 
                              href={`mailto:supervisor@lackner-aufzuege.com?subject=Korrektur%20Urlaub%20${new Date(urlaub.start).toLocaleDateString('de-DE')}%20bis%20${new Date(urlaub.end).toLocaleDateString('de-DE')}&body=Sehr%20geehrte%20Damen%20und%20Herren,%0Aich%20bitte%20um%20Korrektur%20meines%20Urlaubs%20vom%20${new Date(urlaub.start).toLocaleDateString('de-DE')}%20bis%20${new Date(urlaub.end).toLocaleDateString('de-DE')}.%0A%0AMit%20freundlichen%20Gr%C3%BC%C3%9Fen`}
                              className="ml-2 text-[#0066b3] hover:underline" 
                              title="Supervisor kontaktieren"
                            >
                              Supervisor kontaktieren
                            </a>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEdit(urlaub)}
                              className="text-[#0066b3] hover:underline"
                            >
                              Bearbeiten
                            </button>
                            <button 
                              onClick={() => handleDelete(urlaub.id)}
                              className="ml-2 text-red-600 hover:underline"
                            >
                              Löschen
                            </button>
                            {isCurrentUrlaub(urlaub) && (
                              <div className="text-xs text-gray-500 mt-1">
                                Nur zukünftige Tage können noch geändert werden.
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Jahresübersicht */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-[#0066b3] mb-4">Jahresübersicht</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {yearCalendar.map((month, monthIndex) => (
              <div key={monthIndex} className="border rounded-lg p-2 bg-gray-50">
                <div className="font-semibold text-center mb-1">{month.name}</div>
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr>
                      <th>Mo</th><th>Di</th><th>Mi</th><th>Do</th><th>Fr</th><th>Sa</th><th>So</th>
                    </tr>
                  </thead>
                  <tbody>
                    {month.weeks.map((week, weekIndex) => (
                      <tr key={weekIndex}>
                        {week.map((day, dayIndex) => (
                          <td 
                            key={dayIndex} 
                            className={`p-1 ${
                              day.is_holiday && day.is_feiertag 
                                ? 'bg-green-200 border-2 border-yellow-300'
                                : day.is_holiday 
                                ? 'bg-green-200'
                                : day.is_feiertag 
                                ? 'bg-yellow-200'
                                : day.is_weekend 
                                ? 'text-gray-400'
                                : ''
                            } ${
                              !day.in_month ? 'text-gray-300' : ''
                            }`}
                          >
                            {day.day}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>

        {/* Legende */}
        <div className="mt-4 flex flex-wrap gap-6 items-center">
          {legend.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className={`inline-block w-5 h-5 rounded ${item.farbe} border`}></span>
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 