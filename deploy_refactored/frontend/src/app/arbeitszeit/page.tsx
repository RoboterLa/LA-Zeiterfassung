'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { arbeitszeitApi } from '@/services/api';
import { Arbeitszeit, ArbeitszeitForm } from '@/types';
import { updateOvertimeWarnings } from '@/utils/overtimeWarnings';

interface ArbeitszeitStats {
  totalArbeitszeit: string;
  totalPausen: string;
  anzahlEintraege: number;
  anzahlNotdienst: number;
}

interface TagesArbeitszeit {
  datum: string;
  eintraege: Arbeitszeit[];
  gesamtZeit: string;
  startZeit: string;
  endZeit: string;
  notdienst: boolean;
  ueberschritten: boolean;
}

type ZeitraumType = 'tag' | 'woche' | 'monat' | 'letzter_monat' | 'benutzerdefiniert';

export default function ArbeitszeitPage() {
  const [entries, setEntries] = useState<Arbeitszeit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ArbeitszeitStats>({
    totalArbeitszeit: '0:00h',
    totalPausen: '0:00h',
    anzahlEintraege: 0,
    anzahlNotdienst: 0
  });

  // Filter state
  const [filters, setFilters] = useState({
    q: ''
  });

  // Zeitraum state
  const [zeitraumType, setZeitraumType] = useState<ZeitraumType>('monat');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Form state
  const [formData, setFormData] = useState<ArbeitszeitForm>({
    datum: new Date().toISOString().split('T')[0], // Heute als Standard
    start: '',
    stop: '',
    dauer: '',
    notdienstwoche: '0',
    bemerkung: ''
  });

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState<ArbeitszeitForm & { id: string }>({
    id: '',
    datum: '',
    start: '',
    stop: '',
    dauer: '',
    notdienstwoche: '0',
    bemerkung: ''
  });

  // Expandable entries state
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  // Expandable days state
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showOvertimeInfo, setShowOvertimeInfo] = useState(false);

  // Prüfe URL-Parameter für direkte Navigation zu Überstunden
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showOvertime = urlParams.get('show_overtime');
    
    if (showOvertime === 'true') {
      setShowOvertimeInfo(true);
      // Setze Filter auf "Dieser Monat" und expandiere Tage mit Überstunden
      setZeitraumType('Dieser Monat' as ZeitraumType);
      
      // Nach dem Laden der Daten expandiere die Tage mit Überstunden
      setTimeout(() => {
        const overtimeDays = new Set<string>();
        entries.forEach(entry => {
          // Berechne die Gesamtzeit für diesen Tag
          const dayEntries = entries.filter(e => e.datum === entry.datum);
          const totalMinutes = dayEntries.reduce((total, e) => {
            if (e.dauer) {
              const [hours, minutes] = e.dauer.split(':').map(Number);
              return total + (hours * 60 + minutes);
            }
            return total;
          }, 0);
          
          if (totalMinutes > 510) { // 8.5 Stunden = 510 Minuten
            overtimeDays.add(entry.datum);
          }
        });
        setExpandedDays(overtimeDays);
      }, 1000);
    }
  }, [entries]);

  // Prüfe ob ein Tag Überstunden hat
  const hasOvertime = (datum: string): boolean => {
    const dayEntries = entries.filter(e => e.datum === datum);
    const totalMinutes = dayEntries.reduce((total, e) => {
      if (e.dauer) {
        const [hours, minutes] = e.dauer.split(':').map(Number);
        return total + (hours * 60 + minutes);
      }
      return total;
    }, 0);
    return totalMinutes > 510; // 8.5 Stunden = 510 Minuten
  };

  // Toggle entry details
  const toggleEntryDetails = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  // Toggle day details
  const toggleDayDetails = (dayId: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId);
    } else {
      newExpanded.add(dayId);
    }
    setExpandedDays(newExpanded);
  };

  // Konsolidierte Tagesansicht
  const [tagesArbeitszeiten, setTagesArbeitszeiten] = useState<TagesArbeitszeit[]>([]);

  // Lade auch Timer-Daten aus localStorage
  const loadTimerData = () => {
    try {
      const savedEvents = localStorage.getItem('arbeitszeitEvents');
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents).map((ev: any) => ({
          ...ev,
          time: new Date(ev.time)
        }));
        
        // Filtere nur Events vom heutigen Tag
        const heute = new Date().toDateString();
        const heutigeEvents = parsedEvents.filter((ev: any) => ev.time.toDateString() === heute);
        
        // Konvertiere Timer-Events zu Arbeitszeit-Format
        return heutigeEvents.map((event: any) => ({
          id: `timer-${event.time.getTime()}`,
          datum: event.time.toISOString().split('T')[0],
          start: event.time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          stop: event.time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          dauer: '0:00', // Wird später berechnet
          duration: '0:00', // Für Timer-Daten
          notdienstwoche: '0',
          quelle: 'dashboard',
          bemerkung: `Timer: ${event.type}`,
          time: event.time,
          type: event.type
        }));
      }
    } catch (error) {
      console.error('Error loading timer data:', error);
    }
    return [];
  };

  const getZeitraumDates = (type: ZeitraumType) => {
    const heute = new Date();
    
    switch (type) {
      case 'tag':
        return {
          start: heute.toISOString().split('T')[0],
          end: heute.toISOString().split('T')[0]
        };
      case 'woche':
        const startOfWeek = new Date(heute);
        startOfWeek.setDate(heute.getDate() - heute.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          start: startOfWeek.toISOString().split('T')[0],
          end: endOfWeek.toISOString().split('T')[0]
        };
      case 'monat':
        const startOfMonth = new Date(heute.getFullYear(), heute.getMonth(), 1);
        const endOfMonth = new Date(heute.getFullYear(), heute.getMonth() + 1, 0);
        return {
          start: startOfMonth.toISOString().split('T')[0],
          end: endOfMonth.toISOString().split('T')[0]
        };
      case 'letzter_monat':
        const startOfLastMonth = new Date(heute.getFullYear(), heute.getMonth() - 1, 1);
        const endOfLastMonth = new Date(heute.getFullYear(), heute.getMonth(), 0);
        return {
          start: startOfLastMonth.toISOString().split('T')[0],
          end: endOfLastMonth.toISOString().split('T')[0]
        };
      case 'benutzerdefiniert':
        return {
          start: customStartDate,
          end: customEndDate
        };
      default:
        return {
          start: '',
          end: ''
        };
    }
  };

  // Filtere Daten basierend auf Zeitraum
  const filterDataByZeitraum = (data: Arbeitszeit[], zeitraum: ZeitraumType) => {
    const dates = getZeitraumDates(zeitraum);
    const startDate = dates.start;
    const endDate = dates.end;
    
    console.log('Filtering data for period:', zeitraum, 'from', startDate, 'to', endDate);
    
    return data.filter(entry => {
      let entryDate = entry.datum;
      
      // Für Timer-Daten, verwende das Datum aus der time-Eigenschaft
      if (entry.time && !entryDate) {
        entryDate = entry.time.toISOString().split('T')[0];
      }
      
      if (!entryDate) return false;
      
      const isInRange = entryDate >= startDate && entryDate <= endDate;
      console.log('Entry date:', entryDate, 'in range:', isInRange);
      
      return isInRange;
    });
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      
      // Lade alle Daten vom Backend
      const allData = await arbeitszeitApi.getArbeitszeit({});
      
      // Kombiniere Backend-Daten mit Timer-Daten
      const timerEvents = loadTimerData();
      const combinedData = [...allData, ...timerEvents];
      
      console.log('All data:', combinedData);
      
      // Filtere Daten basierend auf Zeitraum
      const filteredData = filterDataByZeitraum(combinedData, zeitraumType);
      
      console.log('Filtered data:', filteredData);
      
      setEntries(filteredData);
      calculateStats(filteredData);
      konsolidiereTagesArbeitszeiten(filteredData);
    } catch (err) {
      setError('Fehler beim Laden der Arbeitszeit-Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [filters, zeitraumType, customStartDate, customEndDate]);

  const konsolidiereTagesArbeitszeiten = (data: Arbeitszeit[]) => {
    const tagesMap = new Map<string, Arbeitszeit[]>();
    
    // Gruppiere nach Datum
    data.forEach(entry => {
      let datum = entry.datum;
      
      // Für Timer-Daten, verwende das Datum aus der time-Eigenschaft
      if (entry.time && !datum) {
        datum = entry.time.toISOString().split('T')[0];
      }
      
      if (!datum) return; // Überspringe Einträge ohne Datum
      
      if (!tagesMap.has(datum)) {
        tagesMap.set(datum, []);
      }
      tagesMap.get(datum)!.push(entry);
    });

    // Erstelle konsolidierte Tagesansicht
    const tagesArbeitszeiten: TagesArbeitszeit[] = [];
    
    tagesMap.forEach((eintraege, datum) => {
      // Sortiere Einträge nach Startzeit (neueste zuerst)
      eintraege.sort((a, b) => {
        // Sortiere zuerst nach Datum (neueste zuerst)
        const dateA = new Date(a.datum);
        const dateB = new Date(b.datum);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        // Bei gleichem Datum sortiere nach Startzeit (späteste zuerst)
        return b.start.localeCompare(a.start);
      });
      
      // Berechne Gesamtzeit für den Tag
      let gesamtMinuten = 0;
      let notdienst = false;
      
      eintraege.forEach(entry => {
        if (entry.dauer) {
          const [h, m] = entry.dauer.split(':').map(Number);
          gesamtMinuten += h * 60 + m;
        } else if (entry.duration) {
          // Timer-Daten haben möglicherweise duration statt dauer
          const [h, m] = entry.duration.split(':').map(Number);
          gesamtMinuten += h * 60 + m;
        }
        if (entry.notdienstwoche === '1') {
          notdienst = true;
        }
      });

      const gesamtStunden = Math.floor(gesamtMinuten / 60);
      const gesamtMinutenRest = gesamtMinuten % 60;
      const gesamtZeit = `${gesamtStunden}:${gesamtMinutenRest.toString().padStart(2, '0')}`;
      
      const startZeit = eintraege[0]?.start || '';
      const endZeit = eintraege[eintraege.length - 1]?.stop || '';

      // Prüfe ob 8,5h überschritten wurden
      const ueberschritten = gesamtMinuten > (8.5 * 60); // 8,5 Stunden in Minuten

      tagesArbeitszeiten.push({
        datum,
        eintraege,
        gesamtZeit,
        startZeit,
        endZeit,
        notdienst,
        ueberschritten
      });
    });

    // Sortiere nach Datum (neueste zuerst)
    tagesArbeitszeiten.sort((a, b) => b.datum.localeCompare(a.datum));
    
    setTagesArbeitszeiten(tagesArbeitszeiten);
  };

  const calculateStats = (data: Arbeitszeit[]) => {
    let totalArbeitszeit = 0;
    let notdienstCount = 0;

    console.log('Calculating stats for data:', data);

    data.forEach(entry => {
      console.log('Processing entry:', entry);
      
      // Behandle sowohl Backend-Daten als auch Timer-Daten
      if (entry.dauer) {
        const [h, m] = entry.dauer.split(':').map(Number);
        totalArbeitszeit += h * 60 + m;
        console.log('Added dauer:', entry.dauer, 'minutes:', h * 60 + m);
      } else if (entry.duration) {
        // Timer-Daten haben möglicherweise duration statt dauer
        const [h, m] = entry.duration.split(':').map(Number);
        totalArbeitszeit += h * 60 + m;
        console.log('Added duration:', entry.duration, 'minutes:', h * 60 + m);
      }
      
      // Für Timer-Daten, berechne Dauer basierend auf Start- und Endzeit
      if (entry.start && entry.stop && !entry.dauer && !entry.duration) {
        const startTime = new Date(`2000-01-01T${entry.start}:00`);
        const stopTime = new Date(`2000-01-01T${entry.stop}:00`);
        const diffMs = stopTime.getTime() - startTime.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        totalArbeitszeit += diffMinutes;
        console.log('Calculated from start/stop:', entry.start, entry.stop, 'minutes:', diffMinutes);
      }
      
      if (entry.notdienstwoche === '1') {
        notdienstCount++;
      }
    });

    const h = Math.floor(totalArbeitszeit / 60);
    const m = totalArbeitszeit % 60;

    const stats = {
      totalArbeitszeit: `${h}:${m.toString().padStart(2, '0')}h`,
      totalPausen: '0:00h', // Placeholder
      anzahlEintraege: data.length,
      anzahlNotdienst: notdienstCount
    };

    console.log('Final stats:', stats);
    setStats(stats);
  };

  const calculateDuration = (start: string, stop: string, datum: string) => {
    if (start && stop && datum) {
      const startTime = new Date(datum + 'T' + start);
      const stopTime = new Date(datum + 'T' + stop);
      let diff = Math.floor((stopTime.getTime() - startTime.getTime()) / 1000);
      if (diff < 0) diff = 0;
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      return `${h}:${m.toString().padStart(2, '0')}`;
    }
    return '';
  };

  const handleFormChange = (field: keyof ArbeitszeitForm, value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    if (field === 'start' || field === 'stop' || field === 'datum') {
      const dauer = calculateDuration(newFormData.start, newFormData.stop, newFormData.datum);
      newFormData.dauer = dauer;
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('=== SUBMIT START ===');
      console.log('Form data:', formData);
      
      // Validiere die Eingaben
      if (!formData.datum || !formData.start || !formData.stop) {
        console.log('Validation failed - missing fields');
        alert('Bitte füllen Sie alle Pflichtfelder aus.');
        return;
      }

      // Prüfe ob Endzeit nach Startzeit liegt
      if (formData.start >= formData.stop) {
        console.log('Validation failed - end time before start time');
        alert('Die Endzeit muss nach der Startzeit liegen.');
        return;
      }

      // Berechne Dauer automatisch
      const dauer = calculateDuration(formData.start, formData.stop, formData.datum);
      const entryData = {
        ...formData,
        dauer: dauer
      };

      console.log('Sending entry data:', entryData);
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');

      const response = await arbeitszeitApi.addArbeitszeit(entryData);
      console.log('API response:', response);
      
      if (response.status === 'success') {
        console.log('Success - reloading entries');
        alert('Eintrag erfolgreich hinzugefügt!');
        setFormData({
          datum: new Date().toISOString().split('T')[0], // Heute als Standard
          start: '',
          stop: '',
          dauer: '',
          notdienstwoche: '0',
          bemerkung: ''
        });
        loadEntries();
        // Aktualisiere Überstunden-Warnungen
        await updateOvertimeWarnings();
      } else {
        console.error('API error:', response);
        alert('Fehler: ' + (response.message || 'Unbekannter Fehler beim Hinzufügen des Eintrags'));
      }
    } catch (err) {
      console.error('=== SUBMIT ERROR ===');
      console.error('Error adding entry:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        response: (err as any)?.response
      });
      alert('Fehler beim Hinzufügen des Eintrags. Bitte versuchen Sie es erneut.');
    }
  };

  // Generiere Zeit-Optionen für Dropdowns (5-Minuten-Schritte von 06:00 bis 18:00)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleEdit = (entry: Arbeitszeit) => {
    setEditData({
      id: entry.id,
      datum: entry.datum,
      start: entry.start,
      stop: entry.stop,
      dauer: entry.dauer,
      notdienstwoche: entry.notdienstwoche,
      bemerkung: entry.bemerkung || ''
    });
    setEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('=== EDIT SUBMIT START ===');
      console.log('Edit data:', editData);
      
      // Validiere die Eingaben
      if (!editData.datum || !editData.start || !editData.stop) {
        alert('Bitte füllen Sie alle Pflichtfelder aus.');
        return;
      }

      // Prüfe ob Endzeit nach Startzeit liegt
      if (editData.start >= editData.stop) {
        alert('Die Endzeit muss nach der Startzeit liegen.');
        return;
      }

      // Berechne Dauer automatisch
      const dauer = calculateDuration(editData.start, editData.stop, editData.datum);
      const updatedEditData = {
        ...editData,
        dauer: dauer
      };

      console.log('Sending edit data:', updatedEditData);

      const response = await arbeitszeitApi.editArbeitszeit(editData.id, updatedEditData);
      console.log('Edit API response:', response);
      
      if (response.status === 'success') {
        console.log('Edit success - reloading entries');
        alert('Eintrag erfolgreich bearbeitet!');
        setEditModal(false);
        loadEntries();
        // Aktualisiere Überstunden-Warnungen
        await updateOvertimeWarnings();
      } else {
        console.error('Edit API error:', response);
        alert('Fehler: ' + (response.message || 'Unbekannter Fehler beim Bearbeiten des Eintrags'));
      }
    } catch (err) {
      console.error('=== EDIT SUBMIT ERROR ===');
      console.error('Error editing entry:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        response: (err as any)?.response
      });
      alert('Fehler beim Bearbeiten des Eintrags. Bitte versuchen Sie es erneut.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Eintrag wirklich löschen?')) {
      try {
        const response = await arbeitszeitApi.deleteArbeitszeit(id);
        if (response.status === 'success') {
          alert('Eintrag erfolgreich gelöscht!');
          loadEntries();
        } else {
          alert('Fehler: ' + response.message);
        }
      } catch (err) {
        alert('Fehler beim Löschen des Eintrags');
      }
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  const resetFilters = () => {
    setFilters({ q: '' });
    setZeitraumType('monat');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const formatDatum = (datum: string) => {
    const date = new Date(datum);
    const heute = new Date();
    const gestern = new Date(heute);
    gestern.setDate(heute.getDate() - 1);
    
    if (datum === heute.toISOString().split('T')[0]) {
      return 'Heute';
    } else if (datum === gestern.toISOString().split('T')[0]) {
      return 'Gestern';
    } else {
      return date.toLocaleDateString('de-DE', { 
        weekday: 'long', 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const getZeitraumLabel = () => {
    const dates = getZeitraumDates(zeitraumType);
    switch (zeitraumType) {
      case 'tag':
        return `Heute (${dates.start})`;
      case 'woche':
        return `Diese Woche (${dates.start} - ${dates.end})`;
      case 'monat':
        return `Dieser Monat (${dates.start} - ${dates.end})`;
      case 'letzter_monat':
        return `Letzter Monat (${dates.start} - ${dates.end})`;
      case 'benutzerdefiniert':
        return `Benutzerdefiniert (${dates.start} - ${dates.end})`;
      default:
        return 'Zeitraum';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={{ id: '1', name: 'Dev User', email: 'dev@example.com', is_admin: true, can_approve: true }} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Lade Arbeitszeit-Daten...</div>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Arbeitszeitverwaltung</h1>
        
        {/* Info-Box für Überstunden-Warnungen */}
        {showOvertimeInfo && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-1">
                  Überstunden-Warnung
                </h3>
                <p className="text-blue-700">
                  Sie wurden hierher geleitet, um Ihre Arbeitszeiten zu überprüfen. 
                  Tage mit Überstunden sind rot hervorgehoben und automatisch expandiert.
                </p>
                <button 
                  onClick={() => setShowOvertimeInfo(false)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Diese Meldung ausblenden
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Neuer Eintrag - ERSTE POSITION */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Neuer Eintrag</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Datum</label>
              <input 
                type="date" 
                value={formData.datum}
                onChange={(e) => handleFormChange('datum', e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Startzeit</label>
              <select 
                value={formData.start}
                onChange={(e) => handleFormChange('start', e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white" 
                required
              >
                <option value="">Zeit wählen</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Endzeit</label>
              <select 
                value={formData.stop}
                onChange={(e) => handleFormChange('stop', e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white" 
                required
              >
                <option value="">Zeit wählen</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Dauer</label>
              <input 
                type="text" 
                value={formData.dauer}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white" 
                placeholder="0:00" 
                readOnly 
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.notdienstwoche === '1'}
                onChange={(e) => handleFormChange('notdienstwoche', e.target.checked ? '1' : '0')}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-900">Notdienstwoche</label>
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">Bemerkung</label>
              <input 
                type="text" 
                value={formData.bemerkung}
                onChange={(e) => handleFormChange('bemerkung', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white"
              />
            </div>
            <div>
              <button 
                type="submit" 
                className="w-full bg-[#0066b3] hover:bg-[#005a9e] text-white font-semibold px-6 py-2 rounded-md transition-colors"
              >
                Hinzufügen
              </button>
            </div>
          </form>
        </div>
        
        {/* Filter und Suche - ZWEITE POSITION */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter und Zeitraum</h2>
          
          {/* Vereinfachte Filter */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Zeitraum</label>
              <select 
                value={zeitraumType} 
                onChange={(e) => setZeitraumType(e.target.value as ZeitraumType)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white"
              >
                <option value="tag">Heute</option>
                <option value="woche">Diese Woche</option>
                <option value="monat">Dieser Monat</option>
                <option value="letzter_monat">Letzter Monat</option>
                <option value="benutzerdefiniert">Benutzerdefiniert</option>
              </select>
            </div>
            
            {zeitraumType === 'benutzerdefiniert' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Startdatum</label>
                  <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Enddatum</label>
                  <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Suche</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={filters.q} 
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                  placeholder="Bemerkung..." 
                  className="flex-1 h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white"
                />
                <button 
                  onClick={() => loadEntries()}
                  className="h-10 px-4 bg-[#0066b3] hover:bg-[#005a9e] text-white rounded-md transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={resetFilters}
                className="h-8 px-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>
        
        {/* Statistiken - DRITTE POSITION */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-xs text-gray-600 mb-1">Arbeitszeit gesamt</div>
            <div className="text-2xl font-bold text-blue-900">{stats.totalArbeitszeit}</div>
            <div className="text-xs text-gray-500 mt-1">{getZeitraumLabel()}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-xs text-gray-600 mb-1">Pausenzeit gesamt</div>
            <div className="text-2xl font-bold text-orange-600">{stats.totalPausen}</div>
            <div className="text-xs text-gray-500 mt-1">{getZeitraumLabel()}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-xs text-gray-600 mb-1">Einträge</div>
            <div className="text-2xl font-bold text-green-700">{stats.anzahlEintraege}</div>
            <div className="text-xs text-gray-500 mt-1">{getZeitraumLabel()}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-xs text-gray-600 mb-1">Notdienstwochen</div>
            <div className="text-2xl font-bold text-red-600">{stats.anzahlNotdienst}</div>
            <div className="text-xs text-gray-500 mt-1">{getZeitraumLabel()}</div>
          </div>
        </div>
        
        {/* Export */}
        <div className="mb-4 flex justify-end">
          <a 
            href="/arbeitszeit/export" 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Export (CSV)
          </a>
        </div>
        
        {/* Konsolidierte Tagesansicht */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Zeiteinträge</h2>
            <p className="text-sm text-gray-600 mt-1">Übersicht aller Arbeitszeiteinträge</p>
          </div>
          
          <div className="p-6">
            {tagesArbeitszeiten.length > 0 ? (
              <div className="space-y-4">
                {tagesArbeitszeiten.map((tag) => (
                  <div key={tag.datum} className={`border border-gray-200 rounded-lg overflow-hidden ${hasOvertime(tag.datum) ? 'border-red-300 bg-red-50' : ''}`}>
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{formatDatum(tag.datum)}</span>
                            <span className="text-sm text-gray-500">|</span>
                            <span className="text-sm text-gray-600">
                              {tag.startZeit} - {tag.endZeit}
                            </span>
                            {tag.notdienst && (
                              <>
                                <span className="text-sm text-gray-500">|</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  Notdienst
                                </span>
                              </>
                            )}
                          </div>
                          {tag.ueberschritten && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded w-fit">
                              <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="text-sm text-red-800">Maximale Arbeitszeit (8,5h) überschritten!</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm text-gray-600">{tag.eintraege.length} Einträge</div>
                          </div>
                          <span className={`text-lg font-semibold ${tag.ueberschritten ? 'text-red-600' : 'text-blue-600'}`}>
                            {tag.gesamtZeit}h
                          </span>
                          <button 
                            onClick={() => toggleDayDetails(tag.datum)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded transition-colors"
                            title="Einträge anzeigen"
                          >
                            <svg className={`h-4 w-4 transform transition-transform ${expandedDays.has(tag.datum) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expandable Day Details */}
                    {expandedDays.has(tag.datum) && (
                      <div className="divide-y divide-gray-100">
                        {tag.eintraege.map((entry, index) => (
                          <div key={entry.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="font-medium text-gray-900">{entry.start} - {entry.stop}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">|</span>
                                  <span className="text-sm text-gray-600">
                                    Dauer: <span className="font-medium">{entry.dauer}h</span>
                                  </span>
                                  {entry.bemerkung && (
                                    <>
                                      <span className="text-sm text-gray-500">|</span>
                                      <span className="text-sm text-gray-600">{entry.bemerkung}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleEdit(entry)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                  title="Bearbeiten"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleDelete(entry.id)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                  title="Löschen"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-gray-500 text-lg mb-2">Keine Arbeitszeiten gefunden</div>
                <div className="text-gray-400 text-sm">Fügen Sie einen neuen Eintrag hinzu</div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Eintrag bearbeiten</h3>
                <form onSubmit={handleEditSubmit}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Datum</label>
                      <input 
                        type="date" 
                        value={editData.datum}
                        onChange={(e) => setEditData({...editData, datum: e.target.value})}
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Startzeit</label>
                      <select 
                        value={editData.start}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          const newDauer = newStart && editData.stop ? calculateDuration(newStart, editData.stop, editData.datum) : '';
                          setEditData({...editData, start: newStart, dauer: newDauer});
                        }}
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white" 
                        required
                      >
                        <option value="">Zeit wählen</option>
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Endzeit</label>
                      <select 
                        value={editData.stop}
                        onChange={(e) => {
                          const newStop = e.target.value;
                          const newDauer = editData.start && newStop ? calculateDuration(editData.start, newStop, editData.datum) : '';
                          setEditData({...editData, stop: newStop, dauer: newDauer});
                        }}
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white" 
                        required
                      >
                        <option value="">Zeit wählen</option>
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Dauer</label>
                      <input 
                        type="text" 
                        value={editData.dauer}
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white" 
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Bemerkung</label>
                    <input 
                      type="text" 
                      value={editData.bemerkung}
                      onChange={(e) => setEditData({...editData, bemerkung: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#0066b3] focus:ring-2 focus:ring-[#0066b3] text-gray-900 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <input 
                      type="checkbox" 
                      checked={editData.notdienstwoche === '1'}
                      onChange={(e) => setEditData({...editData, notdienstwoche: e.target.checked ? '1' : '0'})}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-900">Notdienstwoche</label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => setEditModal(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button 
                      type="submit" 
                      className="bg-[#0066b3] hover:bg-[#005a9e] text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Speichern
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}