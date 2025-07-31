'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { arbeitszeitApi } from '@/services/api';
import { ArbeitszeitState } from '@/types';

interface ArbeitszeitTimerProps {
  onEntryCreated?: () => void;
}

const ArbeitszeitTimer: React.FC<ArbeitszeitTimerProps> = ({ onEntryCreated }) => {
  // State für Timer
  const [arbeitszeitStart, setArbeitszeitStart] = useState<Date | null>(null);
  const [arbeitszeitGesamt, setArbeitszeitGesamt] = useState<number>(0);
  const [arbeitszeitEvents, setArbeitszeitEvents] = useState<Array<{
    type: 'start' | 'stop' | 'pause' | 'resume';
    time: Date;
  }>>([]);
  const [notdienstwoche, setNotdienstwoche] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseStart, setPauseStart] = useState<Date | null>(null);
  const [pauseGesamt, setPauseGesamt] = useState<number>(0);


  // Aktuelle Zeit für Anzeige
  const [currentTime, setCurrentTime] = useState<string>('0:00:00h');

  // State laden beim Start
  useEffect(() => {
    const loadState = () => {
      const savedStart = localStorage.getItem('arbeitszeitStart');
      const savedGesamt = localStorage.getItem('arbeitszeitGesamt');
      const savedEvents = localStorage.getItem('arbeitszeitEvents');
      const savedNotdienst = localStorage.getItem('notdienstwoche');
      const savedPauseStart = localStorage.getItem('arbeitszeitPauseStart');
      const savedPauseGesamt = localStorage.getItem('arbeitszeitPauseGesamt');
      const savedIsPaused = localStorage.getItem('arbeitszeitIsPaused');
      const savedLastDate = localStorage.getItem('arbeitszeitLastDate');

      const heute = new Date().toDateString();
      
      // Prüfe ob es ein neuer Tag ist
      if (savedLastDate && savedLastDate !== heute) {
        // Neuer Tag - alles zurücksetzen
        localStorage.removeItem('arbeitszeitStart');
        localStorage.removeItem('arbeitszeitGesamt');
        localStorage.removeItem('arbeitszeitEvents');
        localStorage.removeItem('arbeitszeitPauseStart');
        localStorage.removeItem('arbeitszeitPauseGesamt');
        localStorage.removeItem('arbeitszeitIsPaused');
        localStorage.setItem('arbeitszeitLastDate', heute);
        return;
      }

      if (savedStart && savedStart !== 'null' && savedStart !== '') {
        const startTime = new Date(parseInt(savedStart));
        // Prüfen ob heute
        if (startTime.toDateString() === heute) {
          setArbeitszeitStart(startTime);
          setIsRunning(true);
        } else {
          // Nicht heute - zurücksetzen
          localStorage.removeItem('arbeitszeitStart');
          localStorage.removeItem('arbeitszeitGesamt');
          localStorage.removeItem('arbeitszeitEvents');
          localStorage.removeItem('arbeitszeitPauseStart');
          localStorage.removeItem('arbeitszeitPauseGesamt');
          localStorage.removeItem('arbeitszeitIsPaused');
        }
      }

      if (savedGesamt) {
        setArbeitszeitGesamt(parseInt(savedGesamt));
      }

      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents).map((ev: any) => ({
          ...ev,
          time: new Date(ev.time)
        }));
        
        // Filtere nur Events vom heutigen Tag
        const heute = new Date().toDateString();
        const heutigeEvents = parsedEvents.filter((ev: any) => ev.time.toDateString() === heute);
        
        setArbeitszeitEvents(heutigeEvents);
      }

      if (savedNotdienst === '1') {
        setNotdienstwoche(true);
      }

      if (savedPauseStart && savedPauseStart !== 'null' && savedPauseStart !== '') {
        setPauseStart(new Date(parseInt(savedPauseStart)));
      }

      if (savedPauseGesamt) {
        setPauseGesamt(parseInt(savedPauseGesamt));
      }

      if (savedIsPaused === 'true') {
        setIsPaused(true);
      }

      // Setze das aktuelle Datum
      localStorage.setItem('arbeitszeitLastDate', heute);
    };

    loadState();
  }, []);

  // Automatischer Neustart um Mitternacht
  useEffect(() => {
    const checkMidnight = () => {
      const jetzt = new Date();
      const heute = jetzt.toDateString();
      const savedLastDate = localStorage.getItem('arbeitszeitLastDate');
      
      if (savedLastDate && savedLastDate !== heute) {
        // Neuer Tag - Timer zurücksetzen
        setArbeitszeitStart(null);
        setIsRunning(false);
        setIsPaused(false);
        setPauseStart(null);
        setPauseGesamt(0);
        setArbeitszeitEvents([]);
        setArbeitszeitGesamt(0);
        
        // LocalStorage zurücksetzen
        localStorage.removeItem('arbeitszeitStart');
        localStorage.removeItem('arbeitszeitGesamt');
        localStorage.removeItem('arbeitszeitEvents');
        localStorage.removeItem('arbeitszeitPauseStart');
        localStorage.removeItem('arbeitszeitPauseGesamt');
        localStorage.removeItem('arbeitszeitIsPaused');
        localStorage.setItem('arbeitszeitLastDate', heute);
      }
    };

    // Prüfe jede Minute
    const interval = setInterval(checkMidnight, 60000);
    
    // Initial prüfen
    checkMidnight();
    
    return () => clearInterval(interval);
  }, []);

  // State speichern
  const saveState = useCallback(async () => {
    const state: ArbeitszeitState = {
      start: arbeitszeitStart,
      gesamt: arbeitszeitGesamt,
      events: arbeitszeitEvents
    };

    // Filtere nur heutige Events für das Speichern
    const heute = new Date().toDateString();
    const heutigeEvents = arbeitszeitEvents.filter(event => event.time.toDateString() === heute);

    // LocalStorage
    localStorage.setItem('arbeitszeitStart', arbeitszeitStart ? arbeitszeitStart.getTime().toString() : '');
    localStorage.setItem('arbeitszeitGesamt', arbeitszeitGesamt.toString());
    localStorage.setItem('arbeitszeitEvents', JSON.stringify(heutigeEvents.map(ev => ({
      ...ev,
      time: ev.time.toISOString()
    }))));
    localStorage.setItem('arbeitszeitPauseStart', pauseStart ? pauseStart.getTime().toString() : '');
    localStorage.setItem('arbeitszeitPauseGesamt', pauseGesamt.toString());
    localStorage.setItem('arbeitszeitIsPaused', isPaused.toString());

    // Server speichern
    try {
      await arbeitszeitApi.saveSession(state);
    } catch (error) {
      console.error('Fehler beim Speichern der Arbeitszeit-Daten:', error);
    }
  }, [arbeitszeitStart, arbeitszeitGesamt, arbeitszeitEvents, pauseStart, pauseGesamt, isPaused]);

  // Automatisches Speichern alle 30 Sekunden
  useEffect(() => {
    const interval = setInterval(saveState, 30000);
    return () => clearInterval(interval);
  }, [saveState]);

  // Anzeige aktualisieren
  const updateArbeitszeitAnzeige = useCallback(() => {
    if (arbeitszeitStart) {
      let aktuell = 0;
      
      if (!isPaused) {
        // Timer läuft - aktuelle Zeit berechnen
        const jetzt = new Date();
        aktuell = Math.floor((jetzt.getTime() - arbeitszeitStart.getTime()) / 1000);
      } else {
        // Timer pausiert - Zeit zum Pause-Start berechnen
        const pauseZeit = pauseStart ? pauseStart.getTime() : arbeitszeitStart.getTime();
        aktuell = Math.floor((pauseZeit - arbeitszeitStart.getTime()) / 1000);
      }
      
      const gesamt = arbeitszeitGesamt + aktuell;
      
      // Pausenzeit abziehen (nur vergangene Pausen, nicht die aktuelle)
      const nettoZeit = gesamt - pauseGesamt;
      
      const stunden = Math.floor(nettoZeit / 3600);
      const minuten = Math.floor((nettoZeit % 3600) / 60);
      const sekunden = nettoZeit % 60;
      
      setCurrentTime(`${stunden}:${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}h`);
    } else {
      setCurrentTime('0:00:00h');
    }
  }, [arbeitszeitStart, arbeitszeitGesamt, isPaused, pauseStart, pauseGesamt]);

  // Timer-Anzeige regelmäßig aktualisieren
  useEffect(() => {
    if (isRunning && !isPaused) {
      const interval = setInterval(updateArbeitszeitAnzeige, 1000);
      return () => clearInterval(interval);
    } else {
      // Sofort aktualisieren wenn pausiert oder gestoppt
      updateArbeitszeitAnzeige();
    }
  }, [isRunning, isPaused, updateArbeitszeitAnzeige]);

  // Statistiken berechnen
  const stats = useMemo(() => {
    let arbeitszeitSumSek = 0;
    let pauseSumSek = pauseGesamt; // Verwende gespeicherte Pausenzeit

    // Berechne Arbeitszeit aus Events
    for (let i = 0; i < arbeitszeitEvents.length; i++) {
      const ev = arbeitszeitEvents[i];
      if (ev.type === 'start') {
        let endTime: Date;
        
        // Finde passendes Stop oder verwende aktuelle Zeit
        if (arbeitszeitEvents[i + 1] && arbeitszeitEvents[i + 1].type === 'stop') {
          endTime = arbeitszeitEvents[i + 1].time;
          i++; // Skip stop event
        } else if (isRunning && !isPaused) {
          // Laufender Block
          endTime = new Date();
        } else {
          // Pausiert - verwende Pause-Start
          endTime = pauseStart || new Date();
        }
        
        const dauer = Math.floor((endTime.getTime() - ev.time.getTime()) / 1000);
        arbeitszeitSumSek += dauer;
      }
    }

    // Falls ein Block läuft, aber noch kein Event existiert
    if (arbeitszeitStart && arbeitszeitEvents.length === 0) {
      const endTime = isPaused ? (pauseStart || new Date()) : new Date();
      const dauer = Math.floor((endTime.getTime() - arbeitszeitStart.getTime()) / 1000);
      arbeitszeitSumSek += dauer;
    }

    // Addiere gespeicherte Arbeitszeit
    arbeitszeitSumSek += arbeitszeitGesamt;

    const arbeitszeitStunden = Math.floor(arbeitszeitSumSek / 3600);
    const arbeitszeitMinuten = Math.floor((arbeitszeitSumSek % 3600) / 60);
    const pauseStunden = Math.floor(pauseSumSek / 3600);
    const pauseMinuten = Math.floor((pauseSumSek % 3600) / 60);

    // Geplantes Ende (8,5h Arbeitszeit)
    const maxArbeitszeit = 8.5 * 3600; // 8,5 Stunden in Sekunden
    const verbleibendeArbeitszeit = maxArbeitszeit - arbeitszeitSumSek;
    
    let geplantesEnde = null;
    if (verbleibendeArbeitszeit > 0) {
      const jetzt = new Date();
      geplantesEnde = new Date(jetzt.getTime() + verbleibendeArbeitszeit * 1000);
    }

    // Warnung 30 Minuten vor 8,5h
    const warnung30Min = arbeitszeitSumSek >= (8 * 3600) && arbeitszeitSumSek < (8.5 * 3600);
    const ueberschritten = arbeitszeitSumSek >= (8.5 * 3600);

    return {
      arbeitszeit: `${arbeitszeitStunden}:${String(arbeitszeitMinuten).padStart(2, '0')}h`,
      pause: `${pauseStunden}:${String(pauseMinuten).padStart(2, '0')}h`,
      geplantesEnde: geplantesEnde ? geplantesEnde.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'Überschritten',
      status: isPaused ? 'Pausiert' : isRunning ? 'Aktiv' : 'Bereit',
      statusColor: isPaused ? 'text-yellow-700' : isRunning ? 'text-green-700' : 'text-gray-700',
      warnung30Min,
      ueberschritten,
      arbeitszeitSekunden: arbeitszeitSumSek
    };
  }, [arbeitszeitEvents, arbeitszeitStart, arbeitszeitGesamt, pauseGesamt, isRunning, isPaused, pauseStart]);

  // Timer starten
  const handleStart = useCallback(() => {
    const startTime = new Date();
    setArbeitszeitStart(startTime);
    setIsRunning(true);
    setIsPaused(false);
    setPauseStart(null);
    setArbeitszeitEvents(prev => [...prev, { type: 'start', time: startTime }]);
    saveState();
  }, [saveState]);

  // Timer pausieren
  const handlePause = useCallback(() => {
    if (arbeitszeitStart && !isPaused) {
      const pauseTime = new Date();
      setPauseStart(pauseTime);
      setIsPaused(true);
      setArbeitszeitEvents(prev => [...prev, { type: 'pause', time: pauseTime }]);
      
      // Sofort Anzeige aktualisieren
      updateArbeitszeitAnzeige();
      saveState();
    }
  }, [arbeitszeitStart, isPaused, saveState, updateArbeitszeitAnzeige]);

  // Timer fortsetzen
  const handleResume = useCallback(() => {
    if (arbeitszeitStart && isPaused && pauseStart) {
      const resumeTime = new Date();
      const pauseDuration = Math.floor((resumeTime.getTime() - pauseStart.getTime()) / 1000);
      setPauseGesamt(prev => prev + pauseDuration);
      setPauseStart(null);
      setIsPaused(false);
      setArbeitszeitEvents(prev => [...prev, { type: 'resume', time: resumeTime }]);
      
      // Sofort Anzeige aktualisieren
      updateArbeitszeitAnzeige();
      saveState();
    }
  }, [arbeitszeitStart, isPaused, pauseStart, saveState, updateArbeitszeitAnzeige]);

  // Timer stoppen
  const handleStop = useCallback(async () => {
    if (!arbeitszeitStart) return;

    const stopTime = new Date();
    const dauer = Math.floor((stopTime.getTime() - arbeitszeitStart.getTime()) / 1000);
    
    // Arbeitszeit-Eintrag automatisch erstellen
    const startDate = new Date(arbeitszeitStart);
    const formData = new FormData();
    formData.append('datum', startDate.toISOString().split('T')[0]);
    formData.append('start', startDate.toTimeString().slice(0, 5));
    formData.append('stop', stopTime.toTimeString().slice(0, 5));
    formData.append('dauer', `${Math.floor(dauer / 3600)}:${String(Math.floor((dauer % 3600) / 60)).padStart(2, '0')}`);
    formData.append('notdienstwoche', notdienstwoche ? '1' : '0');
    formData.append('bemerkung', 'Automatisch erstellt vom Dashboard');

    try {
      await arbeitszeitApi.addArbeitszeit({
        datum: startDate.toISOString().split('T')[0],
        start: startDate.toTimeString().slice(0, 5),
        stop: stopTime.toTimeString().slice(0, 5),
        dauer: `${Math.floor(dauer / 3600)}:${String(Math.floor((dauer % 3600) / 60)).padStart(2, '0')}`,
        notdienstwoche: notdienstwoche ? '1' : '0',
        bemerkung: 'Automatisch erstellt vom Dashboard'
      });
      
      onEntryCreated?.();
    } catch (error) {
      console.error('Fehler beim Erstellen des Arbeitszeit-Eintrags:', error);
    }

    setArbeitszeitStart(null);
    setIsRunning(false);
    setArbeitszeitEvents(prev => [...prev, { type: 'stop', time: stopTime }]);
    setArbeitszeitGesamt(prev => prev + dauer);
    saveState();
  }, [arbeitszeitStart, notdienstwoche, saveState, onEntryCreated]);

  // Notdienstwoche Toggle
  const handleNotdienstToggle = useCallback((checked: boolean) => {
    setNotdienstwoche(checked);
    if (checked) {
      localStorage.setItem('notdienstwoche', '1');
    } else {
      localStorage.removeItem('notdienstwoche');
    }
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      
      {/* Timer und Steuerung */}
      <div className="text-center mb-6">
        <div className="text-3xl font-extrabold mb-4 text-blue-900">{currentTime}</div>
        <div className="flex gap-4 justify-center mb-4">
          <button 
            onClick={handleStart}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg text-base disabled:cursor-not-allowed"
          >
            Start
          </button>
          <button 
            onClick={isPaused ? handleResume : handlePause}
            disabled={!isRunning}
            className={`${
              isPaused 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-yellow-600 hover:bg-yellow-700'
            } disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg text-base disabled:cursor-not-allowed`}
          >
            {isPaused ? 'Fortsetzen' : 'Pause'}
          </button>
          <button 
            onClick={handleStop}
            disabled={!isRunning}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg text-base disabled:cursor-not-allowed"
          >
            Stop
          </button>
        </div>
        
        {/* Notdienstwoche Toggle */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <input 
            type="checkbox" 
            id="notdienstwoche-check"
            checked={notdienstwoche}
            onChange={(e) => handleNotdienstToggle(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="notdienstwoche-check" className="text-sm text-gray-700">
            Notdienstwoche
          </label>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-sm font-bold text-blue-900">{stats.arbeitszeit}</div>
          <div className="text-xs text-blue-700">Arbeitszeit</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded">
          <div className="text-sm font-bold text-orange-600">{stats.pause}</div>
          <div className="text-xs text-orange-700">Pausenzeit</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-sm font-bold text-green-700">{stats.geplantesEnde}</div>
          <div className="text-xs text-green-700">Geplantes Ende</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className={`text-sm font-bold ${stats.statusColor}`}>{stats.status}</div>
          <div className="text-xs text-gray-700">Status</div>
        </div>
      </div>

      {/* Warnungen */}
      {stats.warnung30Min && !stats.ueberschritten && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded mb-3 flex items-center text-sm">
          <svg className="h-4 w-4 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
          </svg>
          <span className="font-medium">
            Warnung: In {Math.max(0, Math.ceil((8.5 * 3600 - stats.arbeitszeitSekunden) / 60))} Min. max. Arbeitszeit erreicht!
          </span>
        </div>
      )}
      {stats.ueberschritten && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-3 py-2 rounded mb-3 flex items-center text-sm">
          <svg className="h-4 w-4 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
          </svg>
          <span className="font-medium">
            ⚠️ Maximale Arbeitszeit (8,5h) überschritten!
          </span>
        </div>
      )}
            

    </div>
  );
};

export default ArbeitszeitTimer; 