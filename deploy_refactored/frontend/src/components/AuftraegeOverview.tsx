'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Auftrag {
  id: string | number;
  art: string;
  uhrzeit: string;
  standort: string;
  coords?: string;
  details?: string;
  done: boolean;
}

interface AuftraegeOverviewProps {
  auftraege: Auftrag[];
  naechsterAuftrag?: {
    uhrzeit: string;
    art: string;
    standort: string;
    coords?: string;
  };
  verbleibendeZeit?: string;
}

export default function AuftraegeOverview({ auftraege, naechsterAuftrag, verbleibendeZeit }: AuftraegeOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const offeneAuftraege = auftraege.filter(a => !a.done);
  const erledigteAuftraege = auftraege.filter(a => a.done);

  const formatTime = (time: string) => {
    return time;
  };

  const getStatusColor = (done: boolean) => {
    return done ? 'text-green-600' : 'text-blue-600';
  };

  const getStatusIcon = (done: boolean) => {
    return done ? (
      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Meine Aufträge heute</h2>
        </div>
        <Link 
          href="/meine-auftraege" 
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Alle Aufträge →
        </Link>
      </div>

      {/* Übersicht */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{auftraege.length}</div>
          <div className="text-sm text-gray-600">Gesamt</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{offeneAuftraege.length}</div>
          <div className="text-sm text-gray-600">Offen</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{erledigteAuftraege.length}</div>
          <div className="text-sm text-gray-600">Erledigt</div>
        </div>
      </div>

      {/* Nächster Auftrag */}
      {naechsterAuftrag && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Nächster Auftrag</h3>
              <div className="text-sm text-blue-700">
                <div><span className="font-medium">Zeit:</span> {formatTime(naechsterAuftrag.uhrzeit)}</div>
                <div><span className="font-medium">Art:</span> {naechsterAuftrag.art}</div>
                <div><span className="font-medium">Standort:</span> {naechsterAuftrag.standort}</div>
                {verbleibendeZeit && (
                  <div><span className="font-medium">Verbleibend:</span> {verbleibendeZeit}</div>
                )}
              </div>
            </div>
            {naechsterAuftrag.coords && (
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${naechsterAuftrag.coords}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Navigation
              </a>
            )}
          </div>
        </div>
      )}

      {/* Aufträge Liste */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Heutige Aufträge</h3>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
          </button>
        </div>
        
        <div className="space-y-2">
          {(isExpanded ? auftraege : auftraege.slice(0, 3)).map((auftrag) => (
            <div key={auftrag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(auftrag.done)}
                <div>
                  <div className="font-medium text-gray-900">{auftrag.art}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(auftrag.uhrzeit)} • {auftrag.standort}
                  </div>
                </div>
              </div>
              <div className={`text-sm font-medium ${getStatusColor(auftrag.done)}`}>
                {auftrag.done ? 'Erledigt' : 'Offen'}
              </div>
            </div>
          ))}
        </div>

        {auftraege.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Keine Aufträge für heute geplant
          </div>
        )}

        {!isExpanded && auftraege.length > 3 && (
          <div className="text-center pt-2">
            <span className="text-sm text-gray-500">
              +{auftraege.length - 3} weitere Aufträge
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 