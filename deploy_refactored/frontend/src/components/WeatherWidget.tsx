'use client';

import React, { useState, useEffect } from 'react';

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    description: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    temp: number;
    description: string;
    icon: string;
    rain_probability: number;
  }>;
}

const WeatherWidget: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock-Daten für das Wetter (in einer echten App würdest du eine Wetter-API verwenden)
  useEffect(() => {
    // Simuliere API-Aufruf
    setTimeout(() => {
      setWeatherData({
        current: {
          temp: 18,
          feels_like: 16,
          humidity: 72,
          wind_speed: 8,
          description: 'Leicht bewölkt',
          icon: 'cloud-sun'
        },
        forecast: [
          {
            date: 'Heute',
            temp: 20,
            description: 'Sonnig',
            icon: 'sun',
            rain_probability: 10
          },
          {
            date: 'Morgen',
            temp: 17,
            description: 'Bewölkt',
            icon: 'cloud',
            rain_probability: 60
          },
          {
            date: 'Übermorgen',
            temp: 15,
            description: 'Regen',
            icon: 'cloud-rain',
            rain_probability: 85
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sun':
        return (
          <svg className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.929 4.929a1 1 0 011.414 0l.707.707A1 1 0 11 5.636 7.05l-.707-.707a1 1 0 010-1.414zM20 12a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM4 12a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM18.364 18.364a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414zM7.05 18.364a1 1 0 001.414 0l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 000 1.414zM12 6a6 6 0 100 12 6 6 0 000-12z"/>
          </svg>
        );
      case 'cloud-sun':
        return (
          <svg className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.929 4.929a1 1 0 011.414 0l.707.707A1 1 0 11 5.636 7.05l-.707-.707a1 1 0 010-1.414zM20 12a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM4 12a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM18.364 18.364a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414zM7.05 18.364a1 1 0 001.414 0l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 000 1.414zM12 6a6 6 0 100 12 6 6 0 000-12z"/>
          </svg>
        );
      case 'cloud':
        return (
          <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
          </svg>
        );
      case 'cloud-rain':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
            <path d="M7 19l3 3m0-3l-3 3m5-2l2 2m0-2l-2 2"/>
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.929 4.929a1 1 0 011.414 0l.707.707A1 1 0 11 5.636 7.05l-.707-.707a1 1 0 010-1.414zM20 12a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM4 12a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM18.364 18.364a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414zM7.05 18.364a1 1 0 001.414 0l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 000 1.414zM12 6a6 6 0 100 12 6 6 0 000-12z"/>
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="text-sm text-gray-500 mt-2">Lade Wetter...</div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col items-center justify-center">
        <div className="text-sm text-gray-500">Wetter nicht verfügbar</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v4l3 3" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Wetter</h2>
        </div>
        <div className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
          → Detaillierte Wetterinfo
        </div>
      </div>
      
      {/* Aktuelle Temperatur */}
      <div className="flex flex-col items-center mb-6">
        <div className="font-medium mb-1 text-gray-700">
          München, Bayern
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">{weatherData.current.temp}°C</div>
        <div className="text-sm text-gray-700 mb-4">{weatherData.current.description}</div>
        <div className="text-xs text-gray-600">
          Feuchtigkeit: {weatherData.current.humidity}% | Wind: {weatherData.current.wind_speed} km/h
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Gefühlt: {weatherData.current.feels_like}°C
        </div>
      </div>

      {/* 3-Tage-Forecast */}
      <div className="border-t pt-4">
        <div className="text-sm font-medium text-gray-700 mb-3">3-Tage-Forecast</div>
        <div className="space-y-3">
          {weatherData.forecast.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {getWeatherIcon(day.icon)}
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{day.date}</div>
                  <div className="text-xs text-gray-600">{day.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">{day.temp}°C</div>
                <div className="text-xs text-blue-600">{day.rain_probability}% Regen</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget; 