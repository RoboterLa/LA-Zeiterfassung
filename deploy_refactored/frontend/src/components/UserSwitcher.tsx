'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface UserSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSwitch: (user: User) => void;
}

const UserSwitcher: React.FC<UserSwitcherProps> = ({ isOpen, onClose, onUserSwitch }) => {
  const [users, setUsers] = useState<User[]>([]);
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

  useEffect(() => {
    if (isOpen) {
      // Für lokale Tests verwenden wir die Test-User
      setUsers(testUsers);
    }
  }, [isOpen]);

  const handleUserSwitch = async (user: User) => {
    try {
      setLoading(true);
      
      // Dev-Login für den gewählten User
      const response = await axios.post('http://localhost:5002/dev_login', {
        email: user.email,
        role: user.role
      }, {
        withCredentials: true
      });

      if (response.status === 200) {
        onUserSwitch(user);
        onClose();
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
      await axios.post('http://localhost:5002/logout', {}, {
        withCredentials: true
      });
      
      // Redirect zur Login-Seite
      window.location.href = '/';
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Buero': return 'bg-blue-100 text-blue-800';
      case 'Monteur': return 'bg-green-100 text-green-800';
      case 'Supervisor': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
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
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSwitch(user)}
                disabled={loading}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                      {getRoleIcon(user.role)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
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

export default UserSwitcher; 