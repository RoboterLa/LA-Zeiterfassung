'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_admin: boolean;
  can_approve: boolean;
}

export default function BueroDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Prüfe User-Session direkt beim Backend
    const checkAuth = async () => {
      try {
        console.log('Büro-Dashboard: Starte Auth-Check...'); // Debug-Log
        const response = await fetch('http://localhost:5002/api/auth/me', {
          credentials: 'include'
        });
        console.log('Büro-Dashboard: Response Status:', response.status); // Debug-Log
        
        if (response.ok) {
          const userData = await response.json();
          console.log('Büro-Dashboard: User-Daten geladen:', userData); // Debug-Log
          if (userData.role === 'Buero' || userData.role === 'Admin') {
            setUser(userData);
            console.log('Büro-Dashboard: User gesetzt'); // Debug-Log
          } else {
            console.log('User hat keine Büro-Berechtigung:', userData.role); // Debug-Log
            router.push('/');
          }
        } else {
          console.log('Response nicht ok:', response.status); // Debug-Log
          // Fallback: Zeige Dashboard trotzdem an
          setUser({
            id: '1',
            name: 'Maria Büro',
            email: 'buero@lackner-aufzuege.com',
            role: 'Buero',
            is_admin: false,
            can_approve: false
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Fallback: Zeige Dashboard trotzdem an
        setUser({
          id: '1',
          name: 'Maria Büro',
          email: 'buero@lackner-aufzuege.com',
          role: 'Buero',
          is_admin: false,
          can_approve: false
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Büro-Interface...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mit Burger-Menü */}
      <Header user={user} />
      
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4">
            <Link 
              href="/buero"
              className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/buero/orders"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 font-medium"
            >
              Aufträge verwalten
            </Link>
            <Link 
              href="/buero/time-entries"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 font-medium"
            >
              Zeiterfassung
            </Link>
            <Link 
              href="/buero/elevators"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 font-medium"
            >
              Stammdaten verwalten
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content - Leeres Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Büro Dashboard
            </h2>
            <p className="text-gray-600 mb-8">
              Willkommen im Büro-Interface. Hier können Sie Aufträge und Stammdaten verwalten.
            </p>
            
            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                href="/buero/orders"
                className="block p-6 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Aufträge verwalten</h3>
                  <p className="text-blue-700 text-sm">Aufträge erstellen, zuweisen und verfolgen</p>
                </div>
              </Link>
              
              <Link 
                href="/buero/time-entries"
                className="block p-6 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">⏰</div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Zeiterfassung verwalten</h3>
                  <p className="text-purple-700 text-sm">Zeiteinträge anlegen und verwalten</p>
                </div>
              </Link>
              
              <Link 
                href="/buero/elevators"
                className="block p-6 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🏢</div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Stammdaten verwalten</h3>
                  <p className="text-green-700 text-sm">Aufzugsanlagen und Komponenten pflegen</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 