'use client';

import { useState } from 'react';
import { auftraegeApi } from '@/services/api';

export default function TestApiPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testGetAuftraege = async () => {
    setLoading(true);
    try {
      const response = await auftraegeApi.getAuftraege();
      setResult(`GET Aufträge erfolgreich: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`GET Aufträge Fehler: ${error.message}`);
    }
    setLoading(false);
  };

  const testUpdateAuftrag = async () => {
    setLoading(true);
    try {
      const response = await auftraegeApi.updateAuftrag('5', { done: true });
      setResult(`UPDATE Auftrag erfolgreich: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setResult(`UPDATE Auftrag Fehler: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testGetAuftraege}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test GET Aufträge
        </button>
        
        <button
          onClick={testUpdateAuftrag}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test UPDATE Auftrag 5
        </button>
      </div>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
} 