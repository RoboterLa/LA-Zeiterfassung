import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { absencesAPI } from '../services/api';

const AbsenceCalendar = ({ onAbsenceClick }) => {
  const { user, isMeister, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [absenceRequests, setAbsenceRequests] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadAbsenceRequests();
  }, []);

  const loadAbsenceRequests = async () => {
    try {
      const response = await absencesAPI.getAll();
      if (response.data.success) {
        setAbsenceRequests(response.data.absence_requests);
      }
    } catch (error) {
      console.error('Failed to load absence requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getAbsenceForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return absenceRequests.find(abs => {
      const start = new Date(abs.start_date);
      const end = new Date(abs.end_date);
      const checkDate = new Date(dateStr);
      return checkDate >= start && checkDate <= end;
    });
  };

  const getAbsenceColor = (absence) => {
    if (!absence) return '';
    
    const colors = {
      'urlaub': 'bg-blue-500',
      'krankheit': 'bg-red-500',
      'freistellung': 'bg-purple-500'
    };
    
    const statusColors = {
      'pending': 'opacity-50',
      'approved': 'opacity-100',
      'rejected': 'opacity-30'
    };
    
    return `${colors[absence.absence_type] || 'bg-gray-500'} ${statusColors[absence.status] || 'opacity-100'}`;
  };

  const getAbsenceIcon = (absence) => {
    if (!absence) return '';
    
    const icons = {
      'urlaub': '🏖️',
      'krankheit': '🏥',
      'freistellung': '📋'
    };
    
    return icons[absence.absence_type] || '📅';
  };

  const getStatusText = (absence) => {
    if (!absence) return '';
    
    const statusTexts = {
      'pending': 'Ausstehend',
      'approved': 'Genehmigt',
      'rejected': 'Abgelehnt'
    };
    
    return statusTexts[absence.status] || '';
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    
    // Leere Tage am Anfang
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 text-gray-400"></div>);
    }
    
    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const absence = getAbsenceForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push(
        <div
          key={day}
          onClick={() => {
            setSelectedDate(date);
            if (absence) {
              onAbsenceClick?.(absence);
            }
          }}
          className={`
            p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
            ${isToday ? 'bg-blue-50 border-blue-300' : ''}
            ${isSelected ? 'bg-yellow-50 border-yellow-300' : ''}
            ${absence ? 'relative' : ''}
          `}
        >
          <div className="text-sm font-medium">{day}</div>
          {absence && (
            <div className="mt-1">
              <div className={`w-2 h-2 rounded-full ${getAbsenceColor(absence)}`}></div>
              <div className="text-xs text-gray-500 mt-1">
                {getAbsenceIcon(absence)} {getStatusText(absence)}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Kalender wird geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Abwesenheitskalender</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ←
          </button>
          <span className="text-lg font-semibold text-gray-700">
            {getMonthName(currentMonth)}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Legende */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legende</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Urlaub</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Krankheit</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span>Freistellung</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 opacity-50 rounded-full mr-2"></div>
            <span>Ausstehend</span>
          </div>
        </div>
      </div>

      {/* Kalender */}
      <div className="grid grid-cols-7 gap-1">
        {/* Wochentage */}
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Kalendertage */}
        {renderCalendar()}
      </div>

      {/* Statistiken */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Monatsübersicht</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {absenceRequests.filter(a => a.absence_type === 'urlaub' && a.status === 'approved').length}
            </div>
            <div className="text-xs text-gray-600">Urlaub genehmigt</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {absenceRequests.filter(a => a.absence_type === 'krankheit' && a.status === 'approved').length}
            </div>
            <div className="text-xs text-gray-600">Krankheit</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {absenceRequests.filter(a => a.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-600">Ausstehend</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsenceCalendar; 