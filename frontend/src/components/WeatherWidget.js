import React from 'react';

const WeatherWidget = () => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">🌤️</span>
          <h3 className="text-lg font-semibold">Wetter</h3>
        </div>
        <button className="text-white opacity-80 hover:opacity-100 text-sm">
          Detailliert →
        </button>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-3xl font-bold mb-2">18°C</div>
        <div className="text-sm opacity-90">Leicht bewölkt</div>
        <div className="text-xs opacity-75 mt-1">Gefühlt: 16°C</div>
      </div>

      <div className="border-t border-white border-opacity-20 pt-4">
        <div className="text-sm font-medium mb-3">3-Tage-Forecast</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2">☀️</span>
              <span className="text-sm">Heute</span>
            </div>
            <span className="text-sm font-bold">20°C</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2">☁️</span>
              <span className="text-sm">Morgen</span>
            </div>
            <span className="text-sm font-bold">17°C</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2">🌧️</span>
              <span className="text-sm">Übermorgen</span>
            </div>
            <span className="text-sm font-bold">15°C</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget; 