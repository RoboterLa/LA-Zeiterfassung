'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserSwitcher from './UserSwitcher';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface BurgerMenuProps {
  currentUser?: User;
  onUserSwitch: (user: User) => void;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ currentUser, onUserSwitch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  // Menü schließen wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.burger-menu')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  const getNavigationItems = () => {
    if (!currentUser) return [];

    const baseItems = [
      { href: '/', label: 'Dashboard', icon: '🏠' },
      { href: '/zeiterfassung', label: 'Zeiterfassung', icon: '⏰' },
      { href: '/meine-auftraege', label: 'Meine Aufträge', icon: '📋' },
    ];

    // Admin-spezifische Links
    if (currentUser.role === 'Admin') {
      baseItems.push(
        { href: '/admin/users', label: 'User-Verwaltung', icon: '👥' },
        { href: '/entries', label: 'Einträge genehmigen', icon: '✅' },
        { href: '/export', label: 'Export', icon: '📊' }
      );
    }

    // Büro-spezifische Links
    if (currentUser.role === 'Buero' || currentUser.role === 'Admin') {
      baseItems.push(
        { href: '/buero', label: 'Büro-Interface', icon: '🏢' },
        { href: '/buero/orders', label: 'Aufträge verwalten', icon: '📋' },
        { href: '/buero/elevators', label: 'Stammdaten', icon: '🏗️' }
      );
    }

    // Supervisor-spezifische Links
    if (currentUser.role === 'Supervisor' || currentUser.role === 'Admin') {
      baseItems.push(
        { href: '/entries', label: 'Einträge genehmigen', icon: '✅' },
        { href: '/export', label: 'Export', icon: '📊' }
      );
    }

    return baseItems;
  };

  return (
    <>
      {/* Burger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="burger-menu p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Menü öffnen"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Menü</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* User Info */}
            {currentUser && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                      {getRoleIcon(currentUser.role)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {currentUser.email}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(currentUser.role)}`}>
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="px-6 py-4">
              <div className="space-y-2">
                {getNavigationItems().map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* User Actions */}
            <div className="px-6 py-4 border-t border-gray-200 mt-auto">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowUserSwitcher(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">Benutzer wechseln</span>
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      await fetch('http://localhost:5002/logout', {
                        method: 'POST',
                        credentials: 'include'
                      });
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">🚪</span>
                  <span className="text-sm font-medium">Abmelden</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 lg:block hidden">
          {/* User Info */}
          {currentUser && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                    {getRoleIcon(currentUser.role)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {currentUser.email}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(currentUser.role)}`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="px-6 py-4">
            <div className="space-y-2">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* User Actions */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowUserSwitcher(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-lg">🔄</span>
                <span className="text-sm font-medium">Benutzer wechseln</span>
              </button>
              
              <button
                onClick={async () => {
                  try {
                    await fetch('http://localhost:5002/logout', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    window.location.href = '/';
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <span className="text-lg">🚪</span>
                <span className="text-sm font-medium">Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Switcher Modal */}
      <UserSwitcher
        isOpen={showUserSwitcher}
        onClose={() => setShowUserSwitcher(false)}
        onUserSwitch={onUserSwitch}
      />
    </>
  );
};

export default BurgerMenu; 