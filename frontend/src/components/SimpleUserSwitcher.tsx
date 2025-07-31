'use client';

import React, { useState } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface SimpleUserSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimpleUserSwitcher: React.FC<SimpleUserSwitcherProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);

  // Test-User für lokale Entwicklung
  const testUsers: User[] = [
    {
      id: 1,
      email: 'buero@lackner-aufzuege.com',
      name: 'Maria Büro',
      role: 'Buero'
    },
    {
      id: 2,
      email: 'admin@lackner-aufzuege.com',
      name: 'System Administrator',
      role: 'Admin'
    },
    {
      id: 3,
      email: 'monteur1@lackner-aufzuege.com',
      name: 'Max Monteur',
      role: 'Monteur'
    },
    {
      id: 4,
      email: 'monteur2@lackner-aufzuege.com',
      name: 'Anna Monteur',
      role: 'Monteur'
    }
  ];

  const handleUserSwitch = async (user: User) => {
    try {
      setLoading(true);
      
      // Dev-Login für den gewählten User
      const response = await fetch('http://localhost:5002/dev_login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          role: user.role
        }),
        credentials: 'include'
      });

      if (response.ok) {
        // Seite neu laden um neue Berechtigungen zu übernehmen
        window.location.reload();
      }
    } catch (error) {
      console.error('Fehler beim Benutzerwechsel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Logout über API
      await fetch('http://localhost:5002/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Redirect zur Login-Seite
      window.location.href = '/';
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return '👑';
      case 'Buero': return '🏢';
      case 'Monteur': return '🔧';
      case 'Supervisor': return '👨‍💼';
      default: return '👤';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Benutzer wechseln</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="px-6 py-4">
          <div className="space-y-3">
            {testUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSwitch(user)}
                disabled={loading}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                      {getRoleIcon(user.role)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                      {user.role}
                    </span>
                  </div>
                  {loading && (
                    <div className="flex-shrink-0">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Wird abgemeldet...' : 'Abmelden'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleUserSwitcher; 