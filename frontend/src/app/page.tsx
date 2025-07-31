'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ArbeitszeitTimer from '@/components/ArbeitszeitTimer';
import WeatherWidget from '@/components/WeatherWidget';
import { dashboardApi } from '@/services/api';
import { DashboardData } from '@/types';
import { updateOvertimeWarnings, getOvertimeWarnings, OvertimeWarning } from '@/utils/overtimeWarnings';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  is_admin: boolean;
  can_approve: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overtimeWarnings, setOvertimeWarnings] = useState<OvertimeWarning[]>([]);

  // Lade aktuelle Session-Daten
  const loadCurrentUser = async () => {
    try {
      console.log('🔍 DEBUG: Lade User-Daten von API...'); // Debug-Log
      const response = await fetch('https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/api/status', {
        credentials: 'include'
      });
      
      console.log('🔍 DEBUG: API Response Status:', response.status); // Debug-Log
      
      if (response.ok) {
        const userData = await response.json();
        console.log('🔍 DEBUG: User-Daten geladen:', userData); // Debug-Log
        console.log('🔍 DEBUG: userData.user:', userData.user); // Debug-Log
        
        if (userData.user) {
          console.log('🔍 DEBUG: User gefunden, setze currentUser'); // Debug-Log
          setCurrentUser(userData.user);
          
          // Prüfe ob Admin - dann zum Backend weiterleiten
          if (userData.user.is_admin) {
            console.log('🔍 DEBUG: Admin erkannt, leite zum Backend weiter...'); // Debug-Log
            window.location.href = 'https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/buero';
            return;
          }
        } else {
          console.log('🔍 DEBUG: Kein User in Session, leite zum Login weiter'); // Debug-Log
          // Kein User eingeloggt - zum Login weiterleiten
          router.push('/login');
          return;
        }
      } else {
        console.log('🔍 DEBUG: Response nicht ok:', response.status); // Debug-Log
        // Kein User eingeloggt - zum Login weiterleiten
        router.push('/login');
        return;
      }
    } catch (error) {
      console.error('🔍 DEBUG: Fehler beim Laden der User-Daten:', error); // Debug-Log
      // Fehler - zum Login weiterleiten
      router.push('/login');
      return;
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Verwende Fallback-Daten statt API-Call
      const fallbackData: DashboardData = {
        user: {
          id: '1',
          name: 'Dev User',
          email: 'dev@example.com',
          is_admin: false,
          can_approve: false
        },
        dashboard_data: {
          stoerungen: [],
          auftraege: [
            {
              id: '1',
              art: 'Reparatur',
              uhrzeit: '07:30',
              standort: 'Hauptbahnhof, München',
              coords: [48.1402, 11.5586],
              details: 'Aufzug klemmt, Notruf ausgelöst.',
              done: false
            },
            {
              id: '2',
              art: 'Wartung',
              uhrzeit: '08:15',
              standort: 'Sendlinger Tor, München',
              coords: [48.1325, 11.5674],
              details: 'Regelmäßige Wartung, Ölwechsel.',
              done: false
            }
          ],
          heutige_arbeitszeit: [],
          urlaub: [],
          offene_zeiteintraege: [],
          letzte_zeiteintraege: [],
          auftraege_offen: 2,
          auftraege_erledigt: 0,
          auftragsarten: {},
          naechster_auftrag_uhrzeit: '07:30',
          naechster_auftrag_art: 'Reparatur',
          naechster_auftrag_standort: 'Hauptbahnhof, München',
          naechster_auftrag_coords: [48.1402, 11.5586],
          verbleibende_zeit: '2:30h',
          pending_count: 0,
          resturlaub: 30
        }
      };
      
      setDashboardData(fallbackData);
      
      // Lade Arbeitszeit-Warnungen
      const warnings = await updateOvertimeWarnings();
      setOvertimeWarnings(warnings);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
    loadDashboardData();
  }, []);

  // Keine automatische Weiterleitung mehr - Backend macht das
  useEffect(() => {
    console.log('🔍 DEBUG: CurrentUser geändert:', currentUser); // Debug-Log
    // Keine client-seitige Weiterleitung - Backend macht das bereits
  }, [currentUser]);

  const handleArbeitszeitEntryCreated = () => {
    loadDashboardData(); // Dashboard-Daten neu laden
  };

  // Verwende aktuellen User oder null (wird durch Session-Check gehandhabt)
  const displayUser = currentUser;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Lade Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Wenn kein User eingeloggt ist, zeige nichts (wird durch Session-Check gehandhabt)
  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Weiterleitung zum Login...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={currentUser || undefined} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Fehler beim Laden</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={displayUser} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Keine Dashboard-Daten verfügbar</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        user={displayUser} 
        pendingCount={dashboardData.dashboard_data.pending_count}
        overtimeWarnings={overtimeWarnings}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Begrüßung */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Guten Tag, {displayUser.name}
          </h1>
          <p className="text-gray-600">Willkommen im Zeiterfassungssystem</p>
        </div>

        {/* Überstunden-Warnung */}
        {overtimeWarnings.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-1">
                    Überstunden-Warnung
                  </h3>
                  <p className="text-red-700">
                    Es wurden {overtimeWarnings.length} Tag(e) mit überschrittenen Arbeitszeiten gefunden.
                  </p>
                  <div className="mt-2 text-sm text-red-600">
                    {overtimeWarnings.map((warning, index) => (
                      <div key={index}>
                        {warning.date}: {warning.totalHours} Stunden
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Link 
                href="/arbeitszeit?show_overtime=true"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Arbeitszeit prüfen
              </Link>
            </div>
          </div>
        )}

        {/* Störungen */}
        {dashboardData.dashboard_data.stoerungen && dashboardData.dashboard_data.stoerungen.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {dashboardData.dashboard_data.stoerungen.map((stoerung, index) => (
              <div key={index} className="stoerung-kachel bg-red-100 border-l-8 border-red-600 rounded-lg shadow-md p-8 flex flex-col justify-center relative animate-pulse">
                <div className="flex items-center mb-2">
                  <svg className="h-8 w-8 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                  </svg>
                  <span className="text-red-700 text-lg font-bold">Störung!</span>
                </div>
                <div className="text-xl font-extrabold mb-2 text-red-900">{stoerung.art}</div>
                <div className="text-base text-gray-700 mb-1">
                  <span className="font-semibold">Adresse:</span> {stoerung.adresse}
                </div>
                <div className="text-base text-gray-700 mb-1">
                  <span className="font-semibold">Bis:</span> {stoerung.deadline}
                </div>
                <div className="mt-4 flex gap-4 items-center">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${stoerung.coords[0]},${stoerung.coords[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded text-lg"
                  >
                    Navigation starten
                  </a>
                  <button className="bg-gray-300 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded flex items-center gap-2 transition-colors">
                    Als erledigt markieren
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meine Aufträge heute und Arbeitszeit Timer - 50/50 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Meine Aufträge heute */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-[#0066b3] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Meine Aufträge heute</h2>
              </div>
              <a 
                href="/meine-auftraege" 
                className="text-sm text-[#0066b3] hover:text-[#005a9e] font-medium"
              >
                Alle Aufträge anzeigen →
              </a>
            </div>
            
            {/* Auftrags-Statistiken */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dashboardData.dashboard_data.auftraege_erledigt || 0}</div>
                <div className="text-sm text-green-700">Erledigt</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{dashboardData.dashboard_data.auftraege_offen || 0}</div>
                <div className="text-sm text-orange-700">Offen</div>
              </div>
            </div>

            {/* Nächste Aufträge */}
            <div className="mb-4">
              <div className="font-semibold text-[#0066b3] mb-3">
                Nächste Aufträge ({dashboardData.dashboard_data.auftraege_offen || 0} offen)
              </div>
              <div className="space-y-2">
                {dashboardData.dashboard_data.auftraege && dashboardData.dashboard_data.auftraege.length > 0 ? (
                  <>
                    {/* Zeige nur die ersten 3 offenen Aufträge */}
                    {dashboardData.dashboard_data.auftraege
                      .filter(auftrag => !auftrag.done)
                      .slice(0, 3)
                      .map((auftrag, index) => (
                        <div key={auftrag.id || index} className="p-3 rounded-lg border-l-4 bg-orange-50 border-orange-400">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {auftrag.uhrzeit || '--:--'} - {auftrag.art || 'Auftrag'}
                                </span>
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                  Offen
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {auftrag.standort || 'Standort unbekannt'}
                              </div>
                              {auftrag.details && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {auftrag.details}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {/* Hinweis wenn es mehr als 3 offene Aufträge gibt */}
                    {dashboardData.dashboard_data.auftraege.filter(auftrag => !auftrag.done).length > 3 && (
                      <div className="p-2 bg-blue-50 rounded-lg text-center text-blue-600 text-xs">
                        +{dashboardData.dashboard_data.auftraege.filter(auftrag => !auftrag.done).length - 3} weitere offene Aufträge
                      </div>
                    )}
                    
                    {/* Zeige erledigte Aufträge nur wenn keine offenen vorhanden */}
                    {dashboardData.dashboard_data.auftraege.filter(auftrag => !auftrag.done).length === 0 && 
                     dashboardData.dashboard_data.auftraege.filter(auftrag => auftrag.done).length > 0 && (
                      dashboardData.dashboard_data.auftraege
                        .filter(auftrag => auftrag.done)
                        .slice(0, 2)
                        .map((auftrag, index) => (
                          <div key={auftrag.id || index} className="p-3 rounded-lg border-l-4 bg-green-50 border-green-400">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {auftrag.uhrzeit || '--:--'} - {auftrag.art || 'Auftrag'}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    Erledigt
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {auftrag.standort || 'Standort unbekannt'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                    Keine Aufträge für heute
                  </div>
                )}
              </div>
            </div>

            {/* Schnellzugriff auf Aufträge */}
            <div className="text-sm text-gray-600">
              <Link href="/meine-auftraege" className="text-[#0066b3] hover:text-[#005a9e] font-medium">
                → Zu allen Aufträgen
              </Link>
            </div>
          </div>

          {/* Arbeitszeit Timer */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Arbeitszeit Timer</h2>
              </div>
              <a 
                href="/arbeitszeit" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Alle Arbeitszeiten anzeigen →
              </a>
            </div>
            <ArbeitszeitTimer onEntryCreated={handleArbeitszeitEntryCreated} />
          </div>
        </div>



        {/* Tageszusammenfassung und Wetter/Wetterwarnungen/Urlaub */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Tageszusammenfassung - 50% (2 Spalten) */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col justify-between">
              <div className="flex items-center mb-3">
                <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Tageszusammenfassung</h2>
              </div>
              
              {/* Große Statuszahlen */}
              <div className="grid grid-cols-2 gap-4">
                {/* Benachrichtigungen */}
                <div 
                  onClick={() => router.push('/approve-entries')}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                    dashboardData.dashboard_data.pending_count > 0 
                      ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                      : 'bg-green-50 border-green-200 hover:bg-green-100'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${
                      dashboardData.dashboard_data.pending_count > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {dashboardData.dashboard_data.pending_count || 0}
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mb-3">Benachrichtigungen</div>
                    <div className="text-xs text-gray-600 mb-3">
                      {dashboardData.dashboard_data.pending_count > 0 
                        ? `${dashboardData.dashboard_data.pending_count} offene Genehmigungen`
                        : 'Keine neuen Benachrichtigungen'
                      }
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      → Zur Genehmigung
                    </div>
                  </div>
                </div>

                {/* Notfälle */}
                <div 
                  onClick={() => router.push('/meine-auftraege')}
                  className="p-6 rounded-lg border-2 bg-orange-50 border-orange-200 cursor-pointer transition-all hover:shadow-md hover:scale-105 hover:bg-orange-100"
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">0</div>
                    <div className="text-sm font-semibold text-gray-700 mb-3">Notfälle</div>
                    <div className="text-xs text-gray-600 mb-3">Keine aktiven Notfälle</div>
                    <div className="text-xs text-blue-600 font-medium">
                      → Zu den Aufträgen
                    </div>
                  </div>
                </div>

                {/* Offene Aufgaben */}
                <div 
                  onClick={() => router.push('/zeiterfassung')}
                  className="p-6 rounded-lg border-2 bg-blue-50 border-blue-200 cursor-pointer transition-all hover:shadow-md hover:scale-105 hover:bg-blue-100"
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {dashboardData.dashboard_data.offene_zeiteintraege?.length || 0}
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mb-3">Offene Aufgaben</div>
                    <div className="text-xs text-gray-600 mb-3">
                      {dashboardData.dashboard_data.offene_zeiteintraege?.length > 0 
                        ? `${dashboardData.dashboard_data.offene_zeiteintraege.length} offene Zeiteinträge`
                        : 'Alle Aufgaben erledigt'
                      }
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      → Zur Zeiterfassung
                    </div>
                  </div>
                </div>

                {/* Nächster Urlaub */}
                <div 
                  onClick={() => router.push('/urlaub')}
                  className="p-6 rounded-lg border-2 bg-purple-50 border-purple-200 cursor-pointer transition-all hover:shadow-md hover:scale-105 hover:bg-purple-100"
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {dashboardData.dashboard_data.resturlaub || 0}
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mb-3">Nächster Urlaub</div>
                    <div className="text-xs text-gray-600 mb-3">
                      {dashboardData.dashboard_data.resturlaub > 0 
                        ? `${dashboardData.dashboard_data.resturlaub} Tage übrig`
                        : 'Kein Urlaub geplant'
                      }
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      → Zum Urlaub
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wetter - 25% (1 Spalte) */}
          <div className="w-full">
            <WeatherWidget />
          </div>
          
          {/* Wetterwarnungen und Urlaub - 25% (1 Spalte) */}
          <div className="w-full">
            {/* Wetterwarnungen oben */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-900">Wetterwarnungen</h3>
                </div>
                <div className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                  → Wetterdienst prüfen
                </div>
              </div>
              
              <div className="space-y-2">
                {/* Status */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs font-medium text-gray-700">Status</span>
                  <span className="text-xs font-semibold text-green-600">Keine Warnungen</span>
                </div>
              </div>
            </div>

            {/* Urlaub unten */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center mb-3">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-900">Urlaub</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{dashboardData.dashboard_data.resturlaub || 0}</div>
                  <div className="text-xs text-gray-600">Übrig</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{dashboardData.dashboard_data.tage_verbraucht || 0}</div>
                  <div className="text-xs text-gray-600">Verbraucht</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{dashboardData.dashboard_data.tage_verplant || 0}</div>
                  <div className="text-xs text-gray-600">Geplant</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zeiteinträge und Wetterwarnungen - 50% Breite */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Zeiteinträge Box */}
          <div className="w-full">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m0-4l-4 4" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Zeiteinträge</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Offene Zeiteinträge */}
                <div 
                  onClick={() => router.push('/zeiterfassung')}
                  className="p-4 rounded-lg border border-gray-200 cursor-pointer transition-all hover:shadow-md hover:scale-105 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Offene Zeiteinträge</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {dashboardData.dashboard_data.offene_zeiteintraege?.length || 0}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {dashboardData.dashboard_data.offene_zeiteintraege?.length > 0 
                      ? `${dashboardData.dashboard_data.offene_zeiteintraege.length} Einträge warten auf Abschluss`
                      : 'Alle Zeiteinträge abgeschlossen'
                    }
                  </div>
                </div>

                {/* Letzte Zeiteinträge */}
                <div 
                  onClick={() => router.push('/zeiterfassung')}
                  className="p-4 rounded-lg border border-gray-200 cursor-pointer transition-all hover:shadow-md hover:scale-105 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Letzte Zeiteinträge</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {dashboardData.dashboard_data.letzte_zeiteintraege?.length || 0}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {dashboardData.dashboard_data.letzte_zeiteintraege?.length > 0 
                      ? `${dashboardData.dashboard_data.letzte_zeiteintraege.length} Einträge in den letzten 24h`
                      : 'Keine Einträge in den letzten 24h'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Heutige Aktivitäten */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Heutige Aktivitäten</h2>
            </div>
            {dashboardData.dashboard_data.heutige_arbeitszeit && dashboardData.dashboard_data.heutige_arbeitszeit.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.dashboard_data.heutige_arbeitszeit.map((entry) => (
                  <div key={entry.id} className="p-3 bg-[#0066b3]/10 rounded-lg">
                    <div className="font-medium text-blue-800">{entry.start} - {entry.stop}</div>
                    <div className="text-sm text-blue-600">Dauer: {entry.dauer}</div>
                    {entry.bemerkung && (
                      <div className="text-xs text-blue-500">{entry.bemerkung}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Keine Aktivitäten für heute</p>
            )}
          </div>
        </div>


      </main>
    </div>
  );
}
