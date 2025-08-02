import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { timeclockAPI } from '../services/api';

const ArbeitszeitTimer = () => {
  const { user, isMonteur, isBuero } = useAuth();
  const [clockStatus, setClockStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isBreak, setIsBreak] = useState(false);

  // Timer für aktuelle Zeit
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lade initialen Status
  useEffect(() => {
    loadClockStatus();
  }, []);

  const loadClockStatus = async () => {
    try {
      const response = await timeclockAPI.getStatus();
      setClockStatus(response.data);
    } catch (error) {
      console.error('Failed to load clock status:', error);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await timeclockAPI.clockIn();
      await loadClockStatus();
    } catch (error) {
      console.error('Clock in failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await timeclockAPI.clockOut();
      await loadClockStatus();
    } catch (error) {
      console.error('Clock out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setLoading(true);
    try {
      await timeclockAPI.startBreak();
      setIsBreak(true);
      await loadClockStatus();
    } catch (error) {
      console.error('Start break failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setLoading(true);
    try {
      await timeclockAPI.endBreak();
      setIsBreak(false);
      await loadClockStatus();
    } catch (error) {
      console.error('End break failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const getWarningColor = (type) => {
    return type === 'critical' ? 'text-red-600' : 'text-yellow-600';
  };

  if (!isMonteur() && !isBuero()) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-gray-600">Zeiterfassung nur für Monteure und Büroangestellte verfügbar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Zeiterfassung</h2>
        <p className="text-gray-600">Willkommen, {user?.name}</p>
        <div className="text-sm text-gray-500 mt-2">
          Aktuelle Zeit: {formatTime(currentTime)}
        </div>
      </div>

      {/* Status Display */}
      {clockStatus && (
        <div className="mb-6">
          {clockStatus.clocked_in ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Eingestempelt
                  </h3>
                  <p className="text-green-600">
                    Seit: {new Date(clockStatus.clock_in_time).toLocaleTimeString('de-DE')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-800">
                    {formatDuration(clockStatus.current_hours)}
                  </div>
                  <div className="text-sm text-green-600">Stunden</div>
                </div>
              </div>

              {/* Warnings */}
              {clockStatus.warnings.length > 0 && (
                <div className="mt-4">
                  {clockStatus.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg mb-2 ${
                        warning.type === 'critical' 
                          ? 'bg-red-100 border border-red-300' 
                          : 'bg-yellow-100 border border-yellow-300'
                      }`}
                    >
                      <div className={`font-semibold ${getWarningColor(warning.type)}`}>
                        ⚠️ {warning.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Ausgestempelt
              </h3>
              <p className="text-gray-600">Bereit zum Einstempeln</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {clockStatus?.clocked_in ? (
          <>
            <button
              onClick={handleClockOut}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Verarbeite...' : 'Ausstempeln'}
            </button>
            
            {!isBreak ? (
              <button
                onClick={handleStartBreak}
                disabled={loading}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Verarbeite...' : 'Pause starten'}
              </button>
            ) : (
              <button
                onClick={handleEndBreak}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Verarbeite...' : 'Pause beenden'}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleClockIn}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Verarbeite...' : 'Einstempeln'}
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Schnellaktionen</h4>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-lg transition-colors">
            Tagesbericht
          </button>
          <button className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-2 px-4 rounded-lg transition-colors">
            Urlaubsantrag
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArbeitszeitTimer; 