'use client';

import React, { useState, useEffect } from 'react';
import { checkOvertimeWarnings, OvertimeWarning } from '@/utils/overtimeWarnings';

export default function TestWarnings() {
  const [warnings, setWarnings] = useState<OvertimeWarning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testWarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing overtime warnings...');
      const result = await checkOvertimeWarnings();
      console.log('Warnings result:', result);
      setWarnings(result);
    } catch (err) {
      console.error('Error testing warnings:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testWarnings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test: Überstunden-Warnungen</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          {loading && <p className="text-blue-600">Lade Warnungen...</p>}
          {error && <p className="text-red-600">Fehler: {error}</p>}
          {!loading && !error && (
            <p className="text-green-600">
              {warnings.length > 0 
                ? `${warnings.length} Warnung(en) gefunden` 
                : 'Keine Warnungen gefunden'
              }
            </p>
          )}
        </div>

        {warnings.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Gefundene Warnungen</h2>
            <div className="space-y-4">
              {warnings.map((warning, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-red-800">
                        {warning.date}: {warning.totalHours} Stunden
                      </h3>
                      <p className="text-red-700">{warning.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Debug-Informationen</h2>
          <button 
            onClick={testWarnings}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Warnungen neu laden
          </button>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Console-Logs:</h3>
            <p className="text-sm text-gray-600">
              Öffne die Browser-Konsole (F12) um detaillierte Logs zu sehen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 