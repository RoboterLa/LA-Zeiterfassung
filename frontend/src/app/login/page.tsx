'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔍 Sending login request to backend...');
      console.log('🔍 Email:', email);
      console.log('🔍 Password:', password);
      
      // Erst prüfen, ob User bereits eingeloggt ist
      console.log('🔍 Checking current user status...');
      const currentUserResponse = await fetch('https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/api/status', {
        credentials: 'include',
      });
      
      console.log('🔍 Current user response status:', currentUserResponse.status);
      
      if (currentUserResponse.ok) {
        const currentUserData = await currentUserResponse.json();
        console.log('🔍 Current user data:', currentUserData);
        
        // Wenn bereits eingeloggt, direkt weiterleiten
        if (currentUserData.user && currentUserData.user.is_admin) {
          console.log('🚀 Admin already logged in, redirecting to backend buero...');
          window.location.href = 'https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/buero';
          return;
        } else if (currentUserData.user) {
          console.log('👷 Monteur already logged in, redirecting to frontend dashboard...');
          window.location.href = 'http://localhost:3000/';
          return;
        }
      } else {
        console.log('🔍 No current user logged in');
      }
      
      // Direkt zum Backend senden
      console.log('🔍 Sending login request...');
      const response = await fetch('https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email,
          password,
        }),
        credentials: 'include',
      });

      console.log('🔍 Login response status:', response.status);
      console.log('🔍 Login response headers:', response.headers);

      if (response.ok || response.status === 302) {
        console.log('✅ Login successful!');
        
        // Prüfe User-Rolle
        console.log('🔍 Checking user role after login...');
        const userResponse = await fetch('https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/api/status', {
          credentials: 'include',
        });
        
        console.log('🔍 User check response status:', userResponse.status);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('🔍 User data after login:', userData);
          
          if (userData.user && userData.user.is_admin) {
            console.log('🚀 Admin detected, redirecting to backend buero...');
            // Admin zum Backend-Büro-Interface
            window.location.href = 'https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/buero';
            return; // Wichtig: Stoppe hier
          } else {
            console.log('👷 Monteur detected, redirecting to frontend dashboard...');
            // Monteur zum Frontend-Dashboard (direkt, nicht über /)
            window.location.href = 'http://localhost:3000/';
          }
        } else {
          console.log('❌ User check failed');
          setError('Fehler beim Laden der Benutzerdaten.');
        }
      } else {
        console.error('❌ Login failed:', response.status);
        setError('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🚀</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zeiterfassung System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Lackner Aufzüge
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Anmelden...' : '🔐 Anmelden'}
            </button>
          </div>
        </form>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Demo-Anmeldedaten:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Administrator:</strong></p>
            <p>E-Mail: admin@lackner-aufzuege.com</p>
            <p>Passwort: admin123</p>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p><strong>Monteur:</strong></p>
              <p>E-Mail: monteur@lackner-aufzuege.com</p>
              <p>Passwort: monteur123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 