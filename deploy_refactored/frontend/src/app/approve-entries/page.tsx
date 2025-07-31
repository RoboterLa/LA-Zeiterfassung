'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { zeiterfassungApi } from '@/services/api';
import { TimeEntry } from '@/types';

export default function ApproveEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    loadEntries();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await zeiterfassungApi.approveEntry(id);
      await loadEntries(); // Neu laden
    } catch (err) {
      console.error('Fehler beim Genehmigen:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await zeiterfassungApi.rejectEntry(id);
      await loadEntries(); // Neu laden
    } catch (err) {
      console.error('Fehler beim Ablehnen:', err);
    }
  };

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

  const pendingEntries = entries.filter(entry => entry.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={{ id: '1', name: 'Dev User', email: 'dev@example.com', is_admin: true, can_approve: true }} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Einträge genehmigen
          </h1>
          <p className="text-gray-600">
            Überprüfen und genehmigen Sie ausstehende Zeiteinträge
          </p>
        </div>

        {pendingEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Keine ausstehenden Einträge vorhanden</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Ausstehende Einträge ({pendingEntries.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aufzug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Standort
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktivität
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zeit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.elevator_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.activity_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.start_time} - {entry.end_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(entry.id)}
                            className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded text-xs"
                          >
                            Genehmigen
                          </button>
                          <button
                            onClick={() => handleReject(entry.id)}
                            className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-xs"
                          >
                            Ablehnen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 