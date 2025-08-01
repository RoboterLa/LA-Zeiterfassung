import React, { useState, useEffect, useRef } from 'react';

const ArbeitszeitTimer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [emergencyWeek, setEmergencyWeek] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTime + pausedTime);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, startTime, pausedTime]);

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!isRunning) {
      setStartTime(Date.now());
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    if (isRunning) {
      if (isPaused) {
        // Resume
        setPausedTime(pausedTime + (Date.now() - startTime));
        setStartTime(Date.now());
        setIsPaused(false);
      } else {
        // Pause
        setIsPaused(true);
      }
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    setStartTime(null);
    setPausedTime(0);
    clearInterval(intervalRef.current);
  };

  const getStatusColor = () => {
    if (!isRunning) return 'text-gray-500';
    if (isPaused) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (!isRunning) return 'Gestoppt';
    if (isPaused) return 'Pausiert';
    return 'Aktiv';
  };

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <div className="text-center">
        <div className={`text-4xl font-bold mb-4 font-mono ${getStatusColor()}`}>
          {formatTime(time)}
        </div>
        
        {/* Timer Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleStart}
            disabled={isRunning && !isPaused}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isRunning && !isPaused
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            ▶️ Start
          </button>
          
          <button
            onClick={handlePause}
            disabled={!isRunning}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              !isRunning
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : isPaused
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            {isPaused ? '▶️ Fortsetzen' : '⏸️ Pause'}
          </button>
          
          <button
            onClick={handleStop}
            disabled={!isRunning && time === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              !isRunning && time === 0
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            ⏹️ Stop
          </button>
        </div>
      </div>

      {/* Timer Statistics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-sm font-bold text-blue-900">
            {formatTime(time).split(':').slice(0, 2).join(':')}
          </div>
          <div className="text-xs text-blue-700">Arbeitszeit</div>
        </div>
        
        <div className="text-center p-2 bg-orange-50 rounded">
          <div className="text-sm font-bold text-orange-600">00:45</div>
          <div className="text-xs text-orange-700">Pausenzeit</div>
        </div>
        
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-sm font-bold text-green-700">16:45</div>
          <div className="text-xs text-green-700">Geplantes Ende</div>
        </div>
        
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className={`text-sm font-bold ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          <div className="text-xs text-gray-600">Status</div>
        </div>
      </div>

      {/* Emergency Week Toggle */}
      <div className="flex items-center justify-center gap-2">
        <input
          type="checkbox"
          id="emergency-week"
          checked={emergencyWeek}
          onChange={(e) => setEmergencyWeek(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="emergency-week" className="text-sm text-gray-700">
          Notdienstwoche
        </label>
      </div>

      {/* Warnings */}
      {time > 7 * 3600000 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded flex items-center text-sm">
          <span className="mr-2">⚠️</span>
          <span>Warnung: In 30 Min. max. Arbeitszeit erreicht!</span>
        </div>
      )}

      {/* Emergency Week Warning */}
      {emergencyWeek && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-3 py-2 rounded flex items-center text-sm">
          <span className="mr-2">🚨</span>
          <span>Notdienstwoche aktiv - Überstunden werden automatisch erfasst</span>
        </div>
      )}
    </div>
  );
};

export default ArbeitszeitTimer; 