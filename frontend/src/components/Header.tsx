'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SimpleUserSwitcher from './SimpleUserSwitcher';

interface User {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  can_approve: boolean;
}

interface HeaderProps {
  user?: User;
  pendingCount?: number;
  overtimeWarnings?: Array<{
    date: string;
    totalHours: string;
    message: string;
  }>;
}

const Header: React.FC<HeaderProps> = ({ user, pendingCount = 0, overtimeWarnings = [] }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  // Berechne Gesamtanzahl der Benachrichtigungen
  const totalNotifications = pendingCount + overtimeWarnings.length;

  // Zeit aktualisieren
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
      setCurrentDate(now.toLocaleDateString('de-DE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Menü schließen wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.menu-container')) {
        setIsMenuOpen(false);
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#0066b3] shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo mit Rahmen */}
        <div className="logo-container flex items-center">
          <div className="bg-white rounded-lg p-2 shadow-md border-2 border-white">
            <img 
              src="https://lackner-aufzuege-gmbh.com/wp-content/uploads/2021/09/cropped-2205_lackner_r.png" 
              alt="Lackner Aufzüge Logo" 
              className="h-10"
            />
          </div>
        </div>

        {/* Rechte Seite */}
        <div className="flex items-center">
          {/* Zeit und Datum */}
          <div className="text-white text-sm mr-4 hidden md:block">
            <span className="mr-2">{currentDate}</span>
            <span>{currentTime}</span>
          </div>

          {/* Benachrichtigungen */}
          <div className="relative mr-4 menu-container">
            <button 
              id="notification-bell"
              className="focus:outline-none relative"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              aria-label="Benachrichtigungen"
            >
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 border-2 border-white">
                  {totalNotifications}
                </span>
              )}
            </button>

            {/* Benachrichtigungs-Dropdown */}
            <div className={`absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-2 z-20 ${isNotificationOpen ? 'block' : 'hidden'}`}>
              <Link 
                href="/approve-entries" 
                className="block px-4 py-3 text-gray-800 hover:bg-gray-100 cursor-pointer"
                onClick={() => setIsNotificationOpen(false)}
              >
                {totalNotifications > 0 ? (
                  <span className="font-semibold">
                    Es gibt {totalNotifications} Benachrichtigungen.
                  </span>
                ) : (
                  <span>Keine neuen Benachrichtigungen.</span>
                )}
              </Link>
              {overtimeWarnings.length > 0 && (
                <div className="mt-2 px-4 py-2 text-gray-800">
                  <h3 className="font-semibold mb-1">Überstundenwarnungen:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {overtimeWarnings.map((warning, index) => (
                      <li key={index}>
                        {warning.date}: {warning.totalHours} Stunden Überstunden.
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href="/arbeitszeit?show_overtime=true" 
                    className="block mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => setIsNotificationOpen(false)}
                  >
                    → Arbeitszeit überprüfen und korrigieren
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Burger-Menü */}
          <div className="relative menu-container">
            <button 
              id="burger-menu-button"
              className="ml-2 flex items-center text-white focus:outline-none" 
              aria-label="Menü öffnen"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Dropdown-Menü */}
            <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30 ${isMenuOpen ? 'block' : 'hidden'}`}>
              <Link 
                href="/" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/zeiterfassung" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Zeiterfassung
              </Link>
              <Link 
                href="/approve-entries" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Zeiteinträge genehmigen
              </Link>
              <Link 
                href="/urlaub" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Urlaubsübersicht
              </Link>
              <Link 
                href="/manage-users" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Benutzerverwaltung
              </Link>
              <Link 
                href="/meine-auftraege" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Meine Aufträge heute
              </Link>
              <Link 
                href="/arbeitszeit" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Arbeitszeit
              </Link>
              
              {/* Benutzer-Umschaltung */}
              <button
                onClick={() => {
                  setShowUserSwitcher(true);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Benutzer wechseln
              </button>
              
              <Link 
                href="/logout" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Abmelden
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* User Switcher Modal */}
      <SimpleUserSwitcher
        isOpen={showUserSwitcher}
        onClose={() => setShowUserSwitcher(false)}
      />
    </header>
  );
};

export default Header; 